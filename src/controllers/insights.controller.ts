import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

interface RiskFactors {
  delayedInvoicesRatio: number;
  budgetOverrunRatio: number;
  progressMismatchRatio: number;
}

// Calculate risk score based on factors
const calculateRiskScore = (factors: RiskFactors): { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } => {
  const weights = {
    delayedInvoices: 0.35,
    budgetOverrun: 0.35,
    progressMismatch: 0.30,
  };

  const score = Math.round(
    factors.delayedInvoicesRatio * weights.delayedInvoices * 100 +
    factors.budgetOverrunRatio * weights.budgetOverrun * 100 +
    factors.progressMismatchRatio * weights.progressMismatch * 100
  );

  const normalizedScore = Math.min(score, 100);

  const level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
    normalizedScore >= 75 ? 'CRITICAL' :
    normalizedScore >= 50 ? 'HIGH' :
    normalizedScore >= 25 ? 'MEDIUM' : 'LOW';

  return { score: normalizedScore, level };
};

// @desc    Get project risk score
// @route   GET /api/insights/risk-score/:projectId
// @access  Private
export const getProjectRiskScore = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      invoices: true,
      progress: { orderBy: { date: 'desc' }, take: 1 },
    },
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Calculate delayed invoices ratio
  const today = new Date();
  const overdueInvoices = project.invoices.filter(
    (inv: { dueDate: Date; status: string }) => inv.dueDate < today && inv.status !== 'PAID' && inv.status !== 'CANCELLED'
  );
  const delayedInvoicesRatio = project.invoices.length > 0
    ? overdueInvoices.length / project.invoices.length
    : 0;

  // Calculate budget overrun ratio
  const budgetOverrunRatio = new Decimal(project.actualCost).greaterThan(project.budget)
    ? Number(new Decimal(project.actualCost).minus(project.budget).dividedBy(project.budget))
    : 0;

  // Calculate progress mismatch ratio
  const latestProgress = project.progress[0];
  const progressMismatchRatio = latestProgress
    ? Math.abs(Number(latestProgress.plannedProgress) - Number(latestProgress.actualProgress)) / 100
    : 0;

  const factors: RiskFactors = {
    delayedInvoicesRatio,
    budgetOverrunRatio: Math.min(budgetOverrunRatio, 1),
    progressMismatchRatio,
  };

  const { score, level } = calculateRiskScore(factors);

  // Save risk log
  await prisma.riskLog.create({
    data: {
      projectId,
      riskScore: score,
      riskLevel: level,
      factors: factors as object,
    },
  });

  res.json({
    success: true,
    data: {
      project_id: projectId,
      project_name: project.name,
      risk_score: score,
      risk_level: level,
      factors: {
        delayed_invoices: Math.round(delayedInvoicesRatio * 100),
        budget_overrun: Math.round(budgetOverrunRatio * 100),
        progress_mismatch: Math.round(progressMismatchRatio * 100),
      },
    },
  });
});

// @desc    Get cash flow forecast
// @route   GET /api/insights/cash-forecast
// @access  Private
export const getCashFlowForecast = asyncHandler(async (req: Request, res: Response) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const historicalData = await prisma.cashFlow.findMany({
    where: { date: { gte: sixMonthsAgo } },
  });

  // Calculate monthly averages
  const monthlyTotals: Record<string, { inflow: number; outflow: number }> = {};

  historicalData.forEach((cf: { date: Date; type: string; amount: Decimal }) => {
    const monthKey = `${cf.date.getFullYear()}-${cf.date.getMonth()}`;
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { inflow: 0, outflow: 0 };
    }
    if (cf.type === 'INFLOW') {
      monthlyTotals[monthKey].inflow += Number(cf.amount);
    } else {
      monthlyTotals[monthKey].outflow += Number(cf.amount);
    }
  });

  const months = Object.values(monthlyTotals);
  const monthCount = months.length || 1;

  const avgInflow = months.reduce((sum, m) => sum + m.inflow, 0) / monthCount;
  const avgOutflow = months.reduce((sum, m) => sum + m.outflow, 0) / monthCount;

  // Calculate trend (simple linear regression)
  let trend = 0;
  if (months.length >= 3) {
    const netCashFlows = months.map((m) => m.inflow - m.outflow);
    const n = netCashFlows.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = netCashFlows.reduce((a, b) => a + b, 0);
    const sumXY = netCashFlows.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) / avgInflow || 0;
  }

  // Forecast next 3 months
  const forecast = [];
  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + i);
    const trendMultiplier = 1 + trend * i;
    forecast.push({
      month: forecastDate.toISOString().slice(0, 7),
      predicted_inflow: Math.round(avgInflow * trendMultiplier),
      predicted_outflow: Math.round(avgOutflow),
      predicted_net: Math.round((avgInflow * trendMultiplier) - avgOutflow),
    });
  }

  res.json({
    success: true,
    data: {
      historical: {
        avg_monthly_inflow: Math.round(avgInflow),
        avg_monthly_outflow: Math.round(avgOutflow),
        avg_net_cash_flow: Math.round(avgInflow - avgOutflow),
        trend_direction: trend > 0.01 ? 'INCREASING' : trend < -0.01 ? 'DECREASING' : 'STABLE',
      },
      forecast,
    },
  });
});

// @desc    Get project health status
// @route   GET /api/insights/project-health
// @access  Private
export const getProjectHealth = asyncHandler(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['IN_PROGRESS', 'PLANNING'] } },
    include: {
      progress: { orderBy: { date: 'desc' }, take: 1 },
      riskLogs: { orderBy: { calculatedAt: 'desc' }, take: 1 },
    },
  });

  const projectHealth = projects.map((project: typeof projects[0]) => {
    const latestProgress = project.progress[0];
    const latestRisk = project.riskLogs[0];

    // Calculate deviation - only negative deviation (behind schedule) is concerning
    const planned = latestProgress ? Number(latestProgress.plannedProgress) : 0;
    const actual = latestProgress ? Number(latestProgress.actualProgress) : 0;
    const progressDeviation = planned - actual; // Positive = behind, Negative = ahead
    const absoluteDeviation = Math.abs(progressDeviation);

    const budgetUtilization = Number(new Decimal(project.actualCost).dividedBy(project.budget));

    let status: 'ON_TRACK' | 'WARNING' | 'AT_RISK';
    let color: 'green' | 'yellow' | 'red';

    // Only flag as at-risk if BEHIND schedule (positive deviation) or over budget
    if ((progressDeviation > 20) || budgetUtilization > 1.2) {
      status = 'AT_RISK';
      color = 'red';
    } else if ((progressDeviation > 10) || budgetUtilization > 1.0) {
      status = 'WARNING';
      color = 'yellow';
    } else {
      status = 'ON_TRACK';
      color = 'green';
    }

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      health: { status, color },
      progress: {
        planned: latestProgress ? Number(latestProgress.plannedProgress) : 0,
        actual: latestProgress ? Number(latestProgress.actualProgress) : 0,
        deviation: progressDeviation,
      },
      budget: {
        allocated: Number(project.budget),
        spent: Number(project.actualCost),
        utilization: Math.round(budgetUtilization * 100),
      },
      riskScore: latestRisk?.riskScore || 0,
      riskLevel: latestRisk?.riskLevel || 'LOW',
    };
  });

  // Summary stats
  const summary = {
    total: projects.length,
    onTrack: projectHealth.filter((p: { health: { status: string } }) => p.health.status === 'ON_TRACK').length,
    warning: projectHealth.filter((p: { health: { status: string } }) => p.health.status === 'WARNING').length,
    atRisk: projectHealth.filter((p: { health: { status: string } }) => p.health.status === 'AT_RISK').length,
  };

  res.json({
    success: true,
    data: {
      summary,
      projects: projectHealth,
    },
  });
});

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

// @desc    Get dashboard KPIs
// @route   GET /api/dashboard/kpis
// @access  Private
export const getKPIs = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalProjects,
    activeProjects,
    totalInvoices,
    pendingInvoices,
    totalRevenue,
    totalExpenses,
    totalCustomers,
    totalVendors,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } } }),
    prisma.invoice.aggregate({
      where: { type: 'RECEIVABLE', status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { type: 'PAYABLE', status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.vendor.count({ where: { isActive: true } }),
  ]);

  res.json({
    success: true,
    data: {
      projects: { total: totalProjects, active: activeProjects },
      invoices: { total: totalInvoices, pending: pendingInvoices },
      revenue: totalRevenue._sum.total || 0,
      expenses: totalExpenses._sum.total || 0,
      customers: totalCustomers,
      vendors: totalVendors,
    },
  });
});

// @desc    Get dashboard alerts
// @route   GET /api/dashboard/alerts
// @access  Private
export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();

  // Overdue invoices
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      dueDate: { lt: today },
      status: { in: ['SENT', 'PARTIAL'] },
    },
    select: {
      id: true,
      invoiceNumber: true,
      dueDate: true,
      total: true,
      customer: { select: { name: true } },
      vendor: { select: { name: true } },
    },
    take: 10,
  });

  // High risk projects
  const highRiskProjects = await prisma.riskLog.findMany({
    where: {
      riskLevel: { in: ['HIGH', 'CRITICAL'] },
    },
    distinct: ['projectId'],
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { calculatedAt: 'desc' },
    take: 5,
  });

  // Budget overrun projects
  const budgetOverrunProjects = await prisma.project.findMany({
    where: {
      actualCost: { gt: prisma.project.fields.budget },
    },
    select: {
      id: true,
      name: true,
      budget: true,
      actualCost: true,
    },
    take: 5,
  });

  res.json({
    success: true,
    data: {
      overdueInvoices: overdueInvoices.map((inv: { id: string; invoiceNumber: string; dueDate: Date; total: Decimal; customer: { name: string } | null; vendor: { name: string } | null }) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        total: inv.total,
        party: inv.customer?.name || inv.vendor?.name,
        daysOverdue: Math.floor((today.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      highRiskProjects: highRiskProjects.map((log: { projectId: string; project: { name: string }; riskScore: number; riskLevel: string }) => ({
        projectId: log.projectId,
        projectName: log.project.name,
        riskScore: log.riskScore,
        riskLevel: log.riskLevel,
      })),
      budgetOverrunProjects,
    },
  });
});

// @desc    Get cash flow summary
// @route   GET /api/dashboard/cash-flow
// @access  Private
export const getCashFlowSummary = asyncHandler(async (req: Request, res: Response) => {
  const { months = 6 } = req.query;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - Number(months));

  const cashFlows = await prisma.cashFlow.findMany({
    where: {
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  // Group by month
  const monthlyData: Record<string, { inflow: Decimal; outflow: Decimal }> = {};

  cashFlows.forEach((cf: { date: Date; type: string; amount: Decimal }) => {
    const monthKey = `${cf.date.getFullYear()}-${String(cf.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { inflow: new Decimal(0), outflow: new Decimal(0) };
    }
    if (cf.type === 'INFLOW') {
      monthlyData[monthKey].inflow = monthlyData[monthKey].inflow.plus(cf.amount);
    } else {
      monthlyData[monthKey].outflow = monthlyData[monthKey].outflow.plus(cf.amount);
    }
  });

  const chartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    inflow: Number(data.inflow),
    outflow: Number(data.outflow),
    netCashFlow: Number(data.inflow.minus(data.outflow)),
  }));

  res.json({
    success: true,
    data: chartData,
  });
});

// @desc    Get receivables/payables summary
// @route   GET /api/dashboard/receivables-payables
// @access  Private
export const getReceivablesPayables = asyncHandler(async (req: Request, res: Response) => {
  const [receivables, payables] = await Promise.all([
    prisma.invoice.aggregate({
      where: { type: 'RECEIVABLE', status: { notIn: ['PAID', 'CANCELLED'] } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { type: 'PAYABLE', status: { notIn: ['PAID', 'CANCELLED'] } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      receivables: {
        total: receivables._sum.total || 0,
        count: receivables._count,
      },
      payables: {
        total: payables._sum.total || 0,
        count: payables._count,
      },
    },
  });
});

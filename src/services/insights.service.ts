import api from '@/lib/api';

export interface RiskScoreData {
  projectId: string;
  projectName: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    budgetVariance: number;
    scheduleVariance: number;
    paymentDelay: number;
    issueCount: number;
  };
  recommendations: string[];
}

export interface CashFlowForecast {
  period: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  cumulativeCash: number;
}

export interface CashFlowForecastData {
  forecast: CashFlowForecast[];
  summary: {
    totalProjectedInflow: number;
    totalProjectedOutflow: number;
    netChange: number;
    currentCashBalance: number;
    projectedEndBalance: number;
  };
  insights: string[];
}

export interface ProjectHealthData {
  projects: {
    id: string;
    name: string;
    status: string;
    progress: number;
    budget: number;
    spent: number;
    budgetVariance: number;
    healthScore: number;
    healthStatus: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  }[];
  summary: {
    totalProjects: number;
    healthyProjects: number;
    atRiskProjects: number;
    criticalProjects: number;
    averageProgress: number;
    totalBudget: number;
    totalSpent: number;
  };
}

export const insightsService = {
  async getProjectRiskScore(projectId: string): Promise<RiskScoreData> {
    const response = await api.get(`/insights/risk-score/${projectId}`);
    return response.data.data;
  },

  async getCashFlowForecast(): Promise<CashFlowForecastData> {
    const response = await api.get('/insights/cash-forecast');
    return response.data.data;
  },

  async getProjectHealth(): Promise<ProjectHealthData> {
    const response = await api.get('/insights/project-health');
    return response.data.data;
  },
};

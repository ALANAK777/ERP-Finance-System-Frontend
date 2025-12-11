import api from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  progress?: ProjectProgress[];
  riskLogs?: RiskLog[];
  _count?: { invoices: number; progress: number; riskLogs: number };
}

export interface ProjectProgress {
  id: string;
  date: string;
  plannedProgress: number;
  actualProgress: number;
  notes?: string;
}

export interface RiskLog {
  id: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    delayedInvoices: number;
    budgetOverrun: number;
    progressMismatch: number;
  };
  calculatedAt: string;
}

export interface ProjectHealth {
  id: string;
  name: string;
  status: string;
  health: { status: 'ON_TRACK' | 'WARNING' | 'AT_RISK'; color: string };
  progress: { planned: number; actual: number; deviation: number };
  budget: { allocated: number; spent: number; utilization: number };
  riskScore: number;
  riskLevel: string;
}

export interface CashForecast {
  historical: {
    avg_monthly_inflow: number;
    avg_monthly_outflow: number;
    avg_net_cash_flow: number;
    trend_direction: string;
  };
  forecast: {
    month: string;
    predicted_inflow: number;
    predicted_outflow: number;
    predicted_net: number;
  }[];
}

export const projectService = {
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: Project[]; pagination: { total: number; pages: number } }> {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  async getProjectById(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data.data;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.data;
  },

  async addProgress(id: string, data: Partial<ProjectProgress>): Promise<ProjectProgress> {
    const response = await api.post(`/projects/${id}/progress`, data);
    return response.data.data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  // AI Insights
  async getRiskScore(projectId: string): Promise<{
    project_id: string;
    project_name: string;
    risk_score: number;
    risk_level: string;
    factors: { delayed_invoices: number; budget_overrun: number; progress_mismatch: number };
  }> {
    const response = await api.get(`/insights/risk-score/${projectId}`);
    return response.data.data;
  },

  async getCashForecast(): Promise<CashForecast> {
    const response = await api.get('/insights/cash-forecast');
    return response.data.data;
  },

  async getProjectHealth(): Promise<{ summary: { total: number; onTrack: number; warning: number; atRisk: number }; projects: ProjectHealth[] }> {
    const response = await api.get('/insights/project-health');
    return response.data.data;
  },
};

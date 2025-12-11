import api from '@/lib/api';

export interface KPIs {
  projects: { total: number; active: number };
  invoices: { total: number; pending: number };
  revenue: number;
  expenses: number;
  customers: number;
  vendors: number;
}

export interface Alert {
  id: string;
  invoiceNumber?: string;
  dueDate?: string;
  total?: number;
  party?: string;
  daysOverdue?: number;
  projectId?: string;
  projectName?: string;
  riskScore?: number;
  riskLevel?: string;
}

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
}

export const dashboardService = {
  async getKPIs(): Promise<KPIs> {
    const response = await api.get('/dashboard/kpis');
    return response.data.data;
  },

  async getAlerts(): Promise<{
    overdueInvoices: Alert[];
    highRiskProjects: Alert[];
    budgetOverrunProjects: Alert[];
  }> {
    const response = await api.get('/dashboard/alerts');
    return response.data.data;
  },

  async getCashFlowSummary(months = 6): Promise<CashFlowData[]> {
    const response = await api.get(`/dashboard/cash-flow?months=${months}`);
    return response.data.data;
  },

  async getReceivablesPayables(): Promise<{
    receivables: { total: number; count: number };
    payables: { total: number; count: number };
  }> {
    const response = await api.get('/dashboard/receivables-payables');
    return response.data.data;
  },
};

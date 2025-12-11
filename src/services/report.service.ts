import api from '@/lib/api';

export interface BalanceSheetItem {
  code: string;
  name: string;
  balance: number;
}

export interface BalanceSheetSection {
  items: BalanceSheetItem[];
  total: number;
}

export interface BalanceSheetData {
  asOfDate: string;
  assets: {
    current: BalanceSheetSection;
    fixed: BalanceSheetSection;
    totalAssets: number;
  };
  liabilities: {
    current: BalanceSheetSection;
    longTerm: BalanceSheetSection;
    totalLiabilities: number;
  };
  equity: {
    items: BalanceSheetItem[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface ProfitLossItem {
  code: string;
  name: string;
  balance: number;
}

export interface ProfitLossSection {
  items: ProfitLossItem[];
  total: number;
}

export interface ProfitLossData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: ProfitLossSection;
  costOfGoodsSold: ProfitLossSection;
  grossProfit: number;
  operatingExpenses: ProfitLossSection;
  operatingIncome: number;
  netIncome: number;
  profitMargin: string | number;
}

export interface CashFlowItem {
  date: string;
  description: string;
  amount: number;
  type: 'INFLOW' | 'OUTFLOW';
}

export interface CashFlowSection {
  items: CashFlowItem[];
  total: number;
}

export interface CashFlowData {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: CashFlowSection;
  investingActivities: CashFlowSection;
  financingActivities: CashFlowSection;
  netCashChange: number;
  beginningCash: number;
  endingCash: number;
}

export const reportService = {
  async getBalanceSheet(date?: string): Promise<BalanceSheetData> {
    const response = await api.get('/reports/balance-sheet', {
      params: date ? { date } : undefined,
    });
    return response.data.data;
  },

  async getProfitLoss(startDate?: string, endDate?: string): Promise<ProfitLossData> {
    const response = await api.get('/reports/profit-loss', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getCashFlowStatement(startDate?: string, endDate?: string): Promise<CashFlowData> {
    const response = await api.get('/reports/cash-flow', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },
};

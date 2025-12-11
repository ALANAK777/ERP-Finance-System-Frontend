import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

// Type definitions
interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: Decimal;
  currency: string;
  isActive: boolean;
}

interface CashFlowRecord {
  id: string;
  date: Date;
  type: string;
  category: string;
  amount: Decimal;
  description: string | null;
}

// @desc    Get Balance Sheet
// @route   GET /api/reports/balance-sheet
// @access  Private
export const getBalanceSheet = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  const asOfDate = date ? new Date(String(date)) : new Date();

  // Get all accounts with their balances
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  }) as Account[];

  // Organize accounts by type
  const assets = accounts.filter((a: Account) => a.type === 'ASSET');
  const liabilities = accounts.filter((a: Account) => a.type === 'LIABILITY');
  const equity = accounts.filter((a: Account) => a.type === 'EQUITY');

  // Calculate totals
  const totalAssets = assets.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  const totalLiabilities = liabilities.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  const totalEquity = equity.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);

  // Categorize assets
  const currentAssets = assets.filter((a: Account) => 
    a.code.startsWith('1001') || a.code.startsWith('1002') || a.code.startsWith('1003') || 
    a.name.toLowerCase().includes('receivable') || a.name.toLowerCase().includes('cash') ||
    a.name.toLowerCase().includes('inventory')
  );
  const fixedAssets = assets.filter((a: Account) => 
    a.code.startsWith('1004') || a.code.startsWith('1005') ||
    a.name.toLowerCase().includes('equipment') || a.name.toLowerCase().includes('property') ||
    a.name.toLowerCase().includes('vehicle')
  );

  // Categorize liabilities
  const currentLiabilities = liabilities.filter((a: Account) => 
    a.code.startsWith('2001') || a.code.startsWith('2002') ||
    a.name.toLowerCase().includes('payable') || a.name.toLowerCase().includes('accrued')
  );
  const longTermLiabilities = liabilities.filter((a: Account) => 
    a.code.startsWith('2003') || a.code.startsWith('2004') ||
    a.name.toLowerCase().includes('loan') || a.name.toLowerCase().includes('long-term')
  );

  res.json({
    success: true,
    data: {
      asOfDate: asOfDate.toISOString(),
      assets: {
        current: {
          items: currentAssets.map((a: Account) => ({
            code: a.code,
            name: a.name,
            balance: Number(a.balance),
          })),
          total: currentAssets.reduce((sum: number, a: Account) => sum + Number(a.balance), 0),
        },
        fixed: {
          items: fixedAssets.map((a: Account) => ({
            code: a.code,
            name: a.name,
            balance: Number(a.balance),
          })),
          total: fixedAssets.reduce((sum: number, a: Account) => sum + Number(a.balance), 0),
        },
        totalAssets,
      },
      liabilities: {
        current: {
          items: currentLiabilities.map((a: Account) => ({
            code: a.code,
            name: a.name,
            balance: Number(a.balance),
          })),
          total: currentLiabilities.reduce((sum: number, a: Account) => sum + Number(a.balance), 0),
        },
        longTerm: {
          items: longTermLiabilities.map((a: Account) => ({
            code: a.code,
            name: a.name,
            balance: Number(a.balance),
          })),
          total: longTermLiabilities.reduce((sum: number, a: Account) => sum + Number(a.balance), 0),
        },
        totalLiabilities,
      },
      equity: {
        items: equity.map((a: Account) => ({
          code: a.code,
          name: a.name,
          balance: Number(a.balance),
        })),
        totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
  });
});

// @desc    Get Profit & Loss Statement
// @route   GET /api/reports/profit-loss
// @access  Private
export const getProfitLoss = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(String(startDate)) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(String(endDate)) : new Date();

  // Get revenue and expense accounts
  const accounts = await prisma.account.findMany({
    where: { 
      isActive: true,
      type: { in: ['REVENUE', 'EXPENSE'] },
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  }) as Account[];

  const revenue = accounts.filter((a: Account) => a.type === 'REVENUE');
  const expenses = accounts.filter((a: Account) => a.type === 'EXPENSE');

  const totalRevenue = revenue.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  const totalExpenses = expenses.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  
  // Categorize expenses
  const costOfGoodsSold = expenses.filter((a: Account) => 
    a.name.toLowerCase().includes('cost') || a.name.toLowerCase().includes('material') ||
    a.name.toLowerCase().includes('labor')
  );
  const operatingExpenses = expenses.filter((a: Account) => 
    !a.name.toLowerCase().includes('cost') && !a.name.toLowerCase().includes('material') &&
    !a.name.toLowerCase().includes('labor')
  );

  const cogsTotal = costOfGoodsSold.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  const operatingTotal = operatingExpenses.reduce((sum: number, a: Account) => sum + Number(a.balance), 0);
  const netIncome = totalRevenue - totalExpenses;

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      revenue: {
        items: revenue.map((a: Account) => ({
          code: a.code,
          name: a.name,
          balance: Number(a.balance),
        })),
        total: totalRevenue,
      },
      costOfGoodsSold: {
        items: costOfGoodsSold.map((a: Account) => ({
          code: a.code,
          name: a.name,
          balance: Number(a.balance),
        })),
        total: cogsTotal,
      },
      grossProfit: totalRevenue - cogsTotal,
      operatingExpenses: {
        items: operatingExpenses.map((a: Account) => ({
          code: a.code,
          name: a.name,
          balance: Number(a.balance),
        })),
        total: operatingTotal,
      },
      operatingIncome: totalRevenue - cogsTotal - operatingTotal,
      netIncome,
      profitMargin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0,
    },
  });
});

// @desc    Get Cash Flow Statement
// @route   GET /api/reports/cash-flow
// @access  Private
export const getCashFlowStatement = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(String(startDate)) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(String(endDate)) : new Date();

  // Get cash flow records
  const cashFlows = await prisma.cashFlow.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'asc' },
  }) as CashFlowRecord[];

  // Group by category
  const operating = cashFlows.filter((cf: CashFlowRecord) => cf.category === 'OPERATING');
  const investing = cashFlows.filter((cf: CashFlowRecord) => cf.category === 'INVESTING');
  const financing = cashFlows.filter((cf: CashFlowRecord) => cf.category === 'FINANCING');

  const calculateTotal = (items: CashFlowRecord[]) => 
    items.reduce((sum: number, cf: CashFlowRecord) => {
      return sum + (cf.type === 'INFLOW' ? Number(cf.amount) : -Number(cf.amount));
    }, 0);

  const operatingTotal = calculateTotal(operating);
  const investingTotal = calculateTotal(investing);
  const financingTotal = calculateTotal(financing);
  const netCashChange = operatingTotal + investingTotal + financingTotal;

  // Get beginning cash balance (from Cash account)
  const cashAccount = await prisma.account.findFirst({
    where: { 
      type: 'ASSET',
      OR: [
        { name: { contains: 'Cash', mode: 'insensitive' } },
        { code: '1001' },
      ],
    },
  }) as Account | null;

  const beginningCash = cashAccount ? Number(cashAccount.balance) - netCashChange : 0;
  const endingCash = beginningCash + netCashChange;

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      operatingActivities: {
        items: operating.map((cf: CashFlowRecord) => ({
          date: cf.date,
          description: cf.description,
          amount: cf.type === 'INFLOW' ? Number(cf.amount) : -Number(cf.amount),
          type: cf.type,
        })),
        total: operatingTotal,
      },
      investingActivities: {
        items: investing.map((cf: CashFlowRecord) => ({
          date: cf.date,
          description: cf.description,
          amount: cf.type === 'INFLOW' ? Number(cf.amount) : -Number(cf.amount),
          type: cf.type,
        })),
        total: investingTotal,
      },
      financingActivities: {
        items: financing.map((cf: CashFlowRecord) => ({
          date: cf.date,
          description: cf.description,
          amount: cf.type === 'INFLOW' ? Number(cf.amount) : -Number(cf.amount),
          type: cf.type,
        })),
        total: financingTotal,
      },
      netCashChange,
      beginningCash,
      endingCash,
    },
  });
});

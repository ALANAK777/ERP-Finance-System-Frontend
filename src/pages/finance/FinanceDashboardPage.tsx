import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { financeService } from '@/services/finance.service';
import { dashboardService } from '@/services/dashboard.service';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface FinancialMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  currentRatio: number;
  debtToEquity: number;
}

interface AccountBreakdown {
  name: string;
  value: number;
  type: string;
}

export function FinanceDashboardPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [accountBreakdown, setAccountBreakdown] = useState<AccountBreakdown[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ month: string; inflow: number; outflow: number }[]>([]);
  const [receivablesPayables, setReceivablesPayables] = useState<{ receivables: number; payables: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsData, rpData] = await Promise.all([
          financeService.getAccounts(),
          dashboardService.getReceivablesPayables(),
        ]);

        // Calculate metrics from accounts
        const assets = accountsData.filter((a) => a.type === 'ASSET');
        const liabilities = accountsData.filter((a) => a.type === 'LIABILITY');
        const equity = accountsData.filter((a) => a.type === 'EQUITY');
        const revenue = accountsData.filter((a) => a.type === 'REVENUE');
        const expenses = accountsData.filter((a) => a.type === 'EXPENSE');

        const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalRevenue = revenue.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalExpenses = expenses.reduce((sum, a) => sum + Number(a.balance || 0), 0);

        setMetrics({
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          currentRatio: totalLiabilities > 0 ? totalAssets / totalLiabilities : 0,
          debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
        });

        // Create breakdown for pie chart
        const breakdown = [
          ...assets.slice(0, 4).map((a) => ({ name: a.name, value: Number(a.balance), type: 'asset' })),
          ...liabilities.slice(0, 3).map((a) => ({ name: a.name, value: Number(a.balance), type: 'liability' })),
        ];
        setAccountBreakdown(breakdown);

        // Mock cash flow trend data (in real app, this would come from API)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const cashFlow = months.map((month) => ({
          month,
          inflow: Math.random() * 500000 + 200000,
          outflow: Math.random() * 400000 + 150000,
        }));
        setCashFlowData(cashFlow);

        setReceivablesPayables({
          receivables: rpData.receivables.total,
          payables: rpData.payables.total,
        });
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
        toast.error('Failed to load financial dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load financial dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive view of your financial health</p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalAssets)}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalLiabilities)}</p>
                <div className="flex items-center text-sm text-red-600 mt-1">
                  <ArrowDownRight className="h-4 w-4" />
                  <span>-5.2% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equity</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalEquity)}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+8.3% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${metrics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.netIncome)}
                </p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Profitable</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentRatio.toFixed(2)}</div>
            <Progress value={Math.min(metrics.currentRatio * 50, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.currentRatio >= 1.5 ? 'Healthy' : metrics.currentRatio >= 1 ? 'Acceptable' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Debt to Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.debtToEquity.toFixed(2)}</div>
            <Progress value={Math.min(metrics.debtToEquity * 33, 100)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.debtToEquity <= 1 ? 'Low risk' : metrics.debtToEquity <= 2 ? 'Moderate' : 'High leverage'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalRevenue > 0
                ? ((metrics.netIncome / metrics.totalRevenue) * 100).toFixed(1)
                : 0}
              %
            </div>
            <Progress
              value={
                metrics.totalRevenue > 0
                  ? Math.min((metrics.netIncome / metrics.totalRevenue) * 100, 100)
                  : 0
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">Based on current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenue</span>
                <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Expenses</span>
                <span className="font-medium">{formatCurrency(metrics.totalExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
            <CardDescription>Monthly inflow vs outflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                inflow: { label: 'Inflow', color: 'hsl(var(--chart-1))' },
                outflow: { label: 'Outflow', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stackId="1"
                    stroke="var(--color-inflow)"
                    fill="var(--color-inflow)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stackId="2"
                    stroke="var(--color-outflow)"
                    fill="var(--color-outflow)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Distribution</CardTitle>
            <CardDescription>Breakdown by account type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: 'Balance', color: 'hsl(var(--chart-1))' },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accountBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accountBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Receivables and Payables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable</CardTitle>
            <CardDescription>Outstanding customer invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(receivablesPayables?.receivables || 0)}
                </span>
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  To Receive
                </Badge>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-sm text-muted-foreground">75% collected this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accounts Payable</CardTitle>
            <CardDescription>Outstanding vendor bills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(receivablesPayables?.payables || 0)}
                </span>
                <Badge variant="outline" className="text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  To Pay
                </Badge>
              </div>
              <Progress value={60} className="h-2" />
              <p className="text-sm text-muted-foreground">60% paid this month</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

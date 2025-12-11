import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { financeService, type Account } from '@/services/finance.service';
import { Loader2, Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface FinancialData {
  assets: Account[];
  liabilities: Account[];
  equity: Account[];
  revenue: Account[];
  expenses: Account[];
  totals: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
}

export function FinancialStatementsPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await financeService.getAccounts();

        // Organize accounts by type
        const assets = data.filter((a) => a.type === 'ASSET');
        const liabilities = data.filter((a) => a.type === 'LIABILITY');
        const equity = data.filter((a) => a.type === 'EQUITY');
        const revenue = data.filter((a) => a.type === 'REVENUE');
        const expenses = data.filter((a) => a.type === 'EXPENSE');

        const totalAssets = assets.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalEquity = equity.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalRevenue = revenue.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const totalExpenses = expenses.reduce((sum, a) => sum + Number(a.balance || 0), 0);
        const netIncome = totalRevenue - totalExpenses;

        setFinancialData({
          assets,
          liabilities,
          equity,
          revenue,
          expenses,
          totals: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalRevenue,
            totalExpenses,
            netIncome,
          },
        });
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        toast.error('Failed to load financial data');
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

  if (!financialData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load financial statements
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
          <p className="text-muted-foreground">View Balance Sheet, P&L, and Cash Flow reports</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{formatCurrency(financialData.totals.totalAssets)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-2xl font-bold">{formatCurrency(financialData.totals.totalLiabilities)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(financialData.totals.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${financialData.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialData.totals.netIncome)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="balance-sheet">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow Statement</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-blue-600">Assets</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.assets.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <span className="text-muted-foreground mr-2">{account.code}</span>
                            {account.name}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(account.balance || 0))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right">{formatCurrency(financialData.totals.totalAssets)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-red-600">Liabilities</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.liabilities.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <span className="text-muted-foreground mr-2">{account.code}</span>
                            {account.name}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(account.balance || 0))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right">{formatCurrency(financialData.totals.totalLiabilities)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <h3 className="font-semibold text-lg mb-4 mt-6 text-purple-600">Equity</h3>
                  <Table>
                    <TableBody>
                      {financialData.equity.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <span className="text-muted-foreground mr-2">{account.code}</span>
                            {account.name}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(account.balance || 0))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>Retained Earnings (Current Year)</TableCell>
                        <TableCell className="text-right">{formatCurrency(financialData.totals.netIncome)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total Equity</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(financialData.totals.totalEquity + financialData.totals.netIncome)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Balance Check */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Liabilities + Equity</span>
                  <span className="font-semibold">
                    {formatCurrency(financialData.totals.totalLiabilities + financialData.totals.totalEquity + financialData.totals.netIncome)}
                  </span>
                </div>
                <Badge
                  variant={
                    Math.abs(
                      financialData.totals.totalAssets -
                        (financialData.totals.totalLiabilities + financialData.totals.totalEquity + financialData.totals.netIncome)
                    ) < 1
                      ? 'default'
                      : 'destructive'
                  }
                  className="mt-2"
                >
                  {Math.abs(
                    financialData.totals.totalAssets -
                      (financialData.totals.totalLiabilities + financialData.totals.totalEquity + financialData.totals.netIncome)
                  ) < 1
                    ? '✓ Balanced'
                    : '✗ Out of Balance'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Current Period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-green-600">Revenue</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.revenue.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <span className="text-muted-foreground mr-2">{account.code}</span>
                            {account.name}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(Number(account.balance || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50 font-semibold">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(financialData.totals.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-red-600">Expenses</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.expenses.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <span className="text-muted-foreground mr-2">{account.code}</span>
                            {account.name}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(Number(account.balance || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 font-semibold">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(financialData.totals.totalExpenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Income */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Net Income</span>
                    <span
                      className={`text-2xl font-bold ${
                        financialData.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(financialData.totals.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Current Period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cash Flows from Operating Activities</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Net Income</TableCell>
                        <TableCell className="text-right">{formatCurrency(financialData.totals.netIncome)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Adjustments for non-cash items</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Changes in working capital</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Net Cash from Operating Activities</TableCell>
                        <TableCell className="text-right">{formatCurrency(financialData.totals.netIncome)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Investing Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cash Flows from Investing Activities</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pl-6">Purchase of equipment</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Sale of investments</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Net Cash from Investing Activities</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Financing Activities */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cash Flows from Financing Activities</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pl-6">Proceeds from loans</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-6">Dividends paid</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Net Cash from Financing Activities</TableCell>
                        <TableCell className="text-right">$0</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Change */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Net Change in Cash</span>
                    <span
                      className={`text-2xl font-bold ${
                        financialData.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(financialData.totals.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

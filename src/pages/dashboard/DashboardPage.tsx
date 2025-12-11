import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardService, type KPIs, type CashFlowData, type Alert } from '@/services/dashboard.service';
import { projectService, type ProjectHealth } from '@/services/project.service';
import {
  Briefcase,
  FileText,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [alerts, setAlerts] = useState<{ overdueInvoices: Alert[]; highRiskProjects: Alert[] } | null>(null);
  const [projectHealth, setProjectHealth] = useState<{ summary: { total: number; onTrack: number; warning: number; atRisk: number }; projects: ProjectHealth[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisData, cashFlowData, alertsData, healthData] = await Promise.all([
          dashboardService.getKPIs(),
          dashboardService.getCashFlowSummary(6),
          dashboardService.getAlerts(),
          projectService.getProjectHealth(),
        ]);
        setKpis(kpisData);
        setCashFlow(cashFlowData);
        setAlerts(alertsData);
        setProjectHealth(healthData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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

  const kpiCards = [
    {
      title: 'Active Projects',
      value: kpis?.projects.active || 0,
      total: kpis?.projects.total || 0,
      icon: Briefcase,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(Number(kpis?.revenue) || 0),
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(Number(kpis?.expenses) || 0),
      change: '+5.2%',
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Pending Invoices',
      value: kpis?.invoices.pending || 0,
      total: kpis?.invoices.total || 0,
      icon: FileText,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Customers',
      value: kpis?.customers || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Vendors',
      value: kpis?.vendors || 0,
      icon: Building2,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  const projectHealthPieData = projectHealth ? [
    { name: 'On Track', value: projectHealth.summary.onTrack, fill: '#22c55e' },
    { name: 'Warning', value: projectHealth.summary.warning, fill: '#eab308' },
    { name: 'At Risk', value: projectHealth.summary.atRisk, fill: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your ERP & Finance system</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  {card.change && (
                    <Badge variant="secondary" className="text-xs">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {card.change}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {card.total !== undefined && (
                    <p className="text-xs text-muted-foreground">of {card.total} total</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
            <CardDescription>Monthly cash inflow and outflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Inflow"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    name="Outflow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Health Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Health</CardTitle>
            <CardDescription>{projectHealth?.summary.total} total projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={projectHealthPieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {projectHealthPieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} projects`, name]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>On Track: {projectHealth?.summary.onTrack || 0}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Warning: {projectHealth?.summary.warning || 0}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>At Risk: {projectHealth?.summary.atRisk || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alerts
            </CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.overdueInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.daysOverdue} days overdue - {invoice.party}
                    </p>
                  </div>
                  <Badge variant="destructive">{formatCurrency(invoice.total || 0)}</Badge>
                </div>
              ))}
              {alerts?.highRiskProjects.slice(0, 2).map((project) => (
                <div key={project.projectId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{project.projectName}</p>
                    <p className="text-sm text-muted-foreground">High risk project</p>
                  </div>
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    Risk: {project.riskScore}
                  </Badge>
                </div>
              ))}
              {(!alerts?.overdueInvoices.length && !alerts?.highRiskProjects.length) && (
                <p className="text-center text-muted-foreground py-8">No alerts at this time</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Planned vs actual progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(projectHealth?.projects.slice(0, 5) || []).map(p => ({
                    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                    planned: p.progress.planned,
                    actual: p.progress.actual,
                  }))}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend />
                  <Bar dataKey="planned" fill="#94a3b8" name="Planned" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

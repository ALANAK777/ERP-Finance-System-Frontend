import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectService, type ProjectHealth } from '@/services/project.service';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface CashFlowData {
  month: string;
  predictedInflow: number;
  predictedOutflow: number;
  netCash: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function InsightsPage() {
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowData[]>([]);
  const [projectHealth, setProjectHealth] = useState<{ summary: { total: number; onTrack: number; warning: number; atRisk: number }; projects: ProjectHealth[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [forecastData, healthData] = await Promise.all([
          projectService.getCashForecast(),
          projectService.getProjectHealth(),
        ]);
        // Transform forecast data to match chart format
        const transformedForecast = forecastData.forecast.map((item) => ({
          month: item.month,
          predictedInflow: item.predicted_inflow,
          predictedOutflow: item.predicted_outflow,
          netCash: item.predicted_net,
        }));
        setCashFlowForecast(transformedForecast);
        setProjectHealth(healthData);
      } catch (error) {
        console.error('Failed to fetch insights data:', error);
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

  const healthRadialData = projectHealth ? [
    { name: 'On Track', value: projectHealth.summary.onTrack, fill: '#22c55e' },
    { name: 'Warning', value: projectHealth.summary.warning, fill: '#eab308' },
    { name: 'At Risk', value: projectHealth.summary.atRisk, fill: '#ef4444' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">Smart analytics and predictive insights</p>
        </div>
      </div>

      <Tabs defaultValue="risk">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Cash Flow Forecast</TabsTrigger>
          <TabsTrigger value="health">Project Health</TabsTrigger>
        </TabsList>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Risk Projects</p>
                    <p className="text-3xl font-bold text-green-600">
                      {projectHealth?.projects.filter((p) => p.riskScore < 40).length || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Medium Risk Projects</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {projectHealth?.projects.filter((p) => p.riskScore >= 40 && p.riskScore < 70).length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk Projects</p>
                    <p className="text-3xl font-bold text-red-600">
                      {projectHealth?.projects.filter((p) => p.riskScore >= 70).length || 0}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Risk Scores</CardTitle>
              <CardDescription>AI-calculated risk assessment for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projectHealth?.projects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">Budget: {formatCurrency(project.budget.allocated)}</p>
                      </div>
                      <Badge
                        className={`${
                          project.riskScore >= 70
                            ? 'bg-red-500'
                            : project.riskScore >= 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        } text-white`}
                      >
                        {project.riskLevel} ({project.riskScore}%)
                      </Badge>
                    </div>
                    <Progress value={project.riskScore} className="h-2" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Budget: {project.budget.utilization}% used</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span>Deviation: {project.progress.deviation}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span>Status: {project.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!projectHealth?.projects || projectHealth.projects.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No project risk data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Predicted Inflow</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(cashFlowForecast.reduce((sum, cf) => sum + cf.predictedInflow, 0))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Predicted Outflow</p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(cashFlowForecast.reduce((sum, cf) => sum + cf.predictedOutflow, 0))}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <CardDescription>AI-powered cash flow predictions for the next 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predictedInflow"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                      name="Predicted Inflow"
                    />
                    <Area
                      type="monotone"
                      dataKey="predictedOutflow"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      name="Predicted Outflow"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Cash Position</CardTitle>
              <CardDescription>Predicted monthly net cash flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="netCash" name="Net Cash" radius={[4, 4, 0, 0]}>
                      {cashFlowForecast.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.netCash >= 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Health Overview</CardTitle>
                <CardDescription>Distribution of project health status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={healthRadialData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                      >
                        {healthRadialData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} projects`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-6 mt-4">
                    {healthRadialData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></span>
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Quick stats on project health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium">On Track</p>
                      <p className="text-sm text-muted-foreground">Projects performing well</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {projectHealth?.summary.onTrack || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <div>
                      <p className="font-medium">Warning</p>
                      <p className="text-sm text-muted-foreground">Projects needing attention</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {projectHealth?.summary.warning || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-medium">At Risk</p>
                      <p className="text-sm text-muted-foreground">Projects requiring intervention</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {projectHealth?.summary.atRisk || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Health Details</CardTitle>
              <CardDescription>Detailed health metrics for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectHealth?.projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        project.health.status === 'ON_TRACK'
                          ? 'bg-green-500'
                          : project.health.status === 'WARNING'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Planned: {project.progress.planned}%</span>
                        <span>Actual: {project.progress.actual}%</span>
                        <span>Deviation: {project.progress.deviation}%</span>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={project.progress.actual} className="h-2" />
                    </div>
                    <Badge
                      variant={
                        project.health.status === 'ON_TRACK'
                          ? 'default'
                          : project.health.status === 'WARNING'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {project.health.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
                {(!projectHealth?.projects || projectHealth.projects.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No project health data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

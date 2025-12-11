import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Brain,
  Building2,
  ChevronRight,
  DollarSign,
  LineChart,
  PieChart,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Financial Management',
    description: 'Complete double-entry bookkeeping with automated journal entries, invoicing, and payment tracking.',
  },
  {
    icon: Building2,
    title: 'Project Tracking',
    description: 'Monitor construction projects with real-time progress tracking, budget analysis, and timeline management.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get intelligent risk analysis, cash flow forecasting, and predictive analytics powered by AI.',
  },
  {
    icon: PieChart,
    title: 'Financial Reports',
    description: 'Generate balance sheets, income statements, and cash flow reports with one click.',
  },
  {
    icon: TrendingUp,
    title: 'Cash Flow Forecasting',
    description: 'Predict future cash positions with AI-powered forecasting for better financial planning.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access control and complete audit trails.',
  },
];

const stats = [
  { label: 'Projects Managed', value: '500+' },
  { label: 'Transactions Processed', value: '$50M+' },
  { label: 'Time Saved', value: '40%' },
  { label: 'Accuracy Rate', value: '99.9%' },
];

export function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ERP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl">AI-ERP Finance</span>
                <span className="text-xs text-muted-foreground">Construction Industry</span>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    Welcome, {user?.firstName}
                  </span>
                  <Button asChild>
                    <Link to="/app/dashboard">
                      Go to Dashboard
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Financial Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Smart Finance Management for{' '}
            <span className="text-primary">Construction Industry</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your construction finance with AI-powered insights, automated bookkeeping, 
            and real-time project tracking. Make smarter financial decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/app/dashboard">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Open Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Start Free Trial
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Sign In to Your Account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Manage Construction Finances
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive ERP solution designed specifically for the construction industry, 
            combining powerful financial tools with AI-driven insights.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Dashboard at Your Fingertips
              </h2>
              <p className="text-muted-foreground mb-6">
                Get a bird's eye view of your entire financial operation. Track revenue, 
                monitor project budgets, analyze cash flow, and identify risks - all in one place.
              </p>
              <ul className="space-y-3">
                {[
                  'Real-time financial KPIs',
                  'Project progress tracking',
                  'AI risk analysis',
                  'Cash flow predictions',
                  'Automated journal entries',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <ChevronRight className="h-3 w-3 text-primary-foreground" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Button className="mt-8" size="lg" asChild>
                  <Link to="/register">Get Started Now</Link>
                </Button>
              )}
            </div>
            <div className="bg-background rounded-2xl shadow-2xl p-6 border">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">$5,350,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">4</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cash Balance</p>
                    <p className="text-2xl font-bold">$345,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center bg-primary rounded-3xl p-12 text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of construction companies using AI-ERP Finance to streamline 
            their operations and make smarter financial decisions.
          </p>
          {isAuthenticated ? (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/app/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Start Your Free Trial</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ERP</span>
              </div>
              <span className="font-semibold">AI-ERP Finance System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AI-ERP Finance. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground">Login</Link>
              <Link to="/register" className="hover:text-foreground">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

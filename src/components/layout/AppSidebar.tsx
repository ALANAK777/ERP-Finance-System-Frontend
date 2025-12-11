import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  PieChart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  BookOpen,
  Receipt,
  Wallet,
  UserCircle,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/app/dashboard',
    roles: ['Admin', 'Finance Manager', 'Project Manager'],
  },
  {
    title: 'Projects',
    icon: Briefcase,
    href: '/app/projects',
    roles: ['Admin', 'Finance Manager', 'Project Manager'],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    href: '/app/finance',
    roles: ['Admin', 'Finance Manager'],
    children: [
      { title: 'Dashboard', href: '/app/finance/dashboard', icon: LayoutDashboard },
      { title: 'Accounts', href: '/app/finance/accounts', icon: BookOpen },
      { title: 'Journal Entries', href: '/app/finance/journal-entries', icon: FileText },
      { title: 'Invoices', href: '/app/finance/invoices', icon: Receipt },
      { title: 'Payments', href: '/app/finance/payments', icon: Wallet },
      { title: 'Vendors', href: '/app/finance/vendors', icon: Building2 },
      { title: 'Customers', href: '/app/finance/customers', icon: UserCircle },
      { title: 'Reports', href: '/app/finance/reports', icon: PieChart },
    ],
  },
  {
    title: 'AI Insights',
    icon: TrendingUp,
    href: '/app/insights',
    roles: ['Admin', 'Finance Manager', 'Project Manager'],
  },
  {
    title: 'Administration',
    icon: ShieldCheck,
    href: '/app/admin',
    roles: ['Admin'],
    children: [
      { title: 'Users', href: '/app/admin/users', icon: Users },
      { title: 'Roles', href: '/app/admin/roles', icon: ShieldCheck },
      { title: 'Audit Logs', href: '/app/admin/audit-logs', icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isOpen, toggle } = useSidebarStore();

  const filteredMenuItems = menuItems.filter(
    (item) => item.roles.includes(user?.role || '')
  );

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {isOpen && (
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ERP</span>
            </div>
            <span className="font-semibold text-sidebar-foreground">Finance</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-sidebar-foreground"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              location.pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isOpen && <span>{item.title}</span>}
                </Link>
                {isOpen && item.children && isActive && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              isChildActive
                                ? 'text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground/70'
                            )}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-sidebar-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-full text-sidebar-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsAdmin } from '@/lib/auth/isAdmin';
import { SessionRetry } from '@/components/auth/SessionRetry';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  LogOut,
  MapPin,
  Timer,
  Receipt,
  ArrowUpRight,
  Menu,
  Monitor,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

interface AdminLayoutClientProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const DASHBOARD_ITEM: NavItem = { href: '/admin', label: 'Dashboard', icon: LayoutDashboard };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/articles', label: 'Articles', icon: FileText },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/admin/payments', label: 'Payments', icon: Receipt },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'Personal',
    items: [
      { href: '/admin/relationship', label: 'Pins', icon: MapPin },
      { href: '/admin/emom', label: 'EMOM', icon: Timer },
    ],
  },
];

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const isActiveItem = (href: string, pathname: string) =>
  href === DASHBOARD_ITEM.href ? pathname === href : pathname.startsWith(href);

const activeLabel = (pathname: string) =>
  [DASHBOARD_ITEM, ...NAV_GROUPS.flatMap((group) => group.items)].find((item) =>
    isActiveItem(item.href, pathname),
  )?.label ?? 'Admin';

const linkClass =
  'flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Theme" className="flex gap-1 rounded-md bg-muted p-1">
      {THEMES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={label}
          className={cn(
            'flex flex-1 items-center justify-center rounded px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground',
            { 'bg-background text-foreground shadow-sm': theme === value },
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function AdminNav({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const renderItem = (item: NavItem) => (
    <li key={item.href}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActiveItem(item.href, pathname) ? 'page' : undefined}
        className={cn(linkClass, {
          'bg-accent text-accent-foreground': isActiveItem(item.href, pathname),
        })}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    </li>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b">
        <Link href="/" onClick={onNavigate} className="block">
          <span className="text-lg font-bold">luisfaria.dev</span>
          <span className="block text-sm text-muted-foreground">Admin</span>
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-4 space-y-6">
        <ul>{renderItem(DASHBOARD_ITEM)}</ul>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">{group.items.map(renderItem)}</ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-4 space-y-2">
        <Link href="/" onClick={onNavigate} className={linkClass}>
          <ArrowUpRight className="h-4 w-4" />
          View site
        </Link>
        <div className="px-4 py-1">
          <ThemeToggle />
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { status, logout, refetchUser } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Redirect only on a *definitive* result - never while `initializing` or on a
    // transient ME failure (`error`), which is what caused spurious bounces on refresh.
    if (status === 'unauthenticated') {
      // Preserve the exact admin destination (e.g. /admin/users) for post-login return.
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
    } else if (status === 'authenticated' && !isAdmin) {
      router.push('/');
    }
  }, [status, isAdmin, pathname, router]);

  // Couldn't verify the session (transient) - offer a retry instead of a logout.
  if (status === 'error') {
    return <SessionRetry onRetry={refetchUser} />;
  }

  if (status !== 'authenticated' || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold">{activeLabel(pathname)}</span>
      </header>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate the admin area</SheetDescription>
          <AdminNav
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>

      <aside className="hidden md:block md:w-64 md:shrink-0 md:sticky md:top-0 md:h-screen bg-card border-r">
        <AdminNav pathname={pathname} onLogout={logout} />
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}

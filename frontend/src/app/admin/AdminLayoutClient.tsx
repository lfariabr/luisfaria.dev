'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useIsAdmin } from '@/lib/auth/isAdmin';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminLayoutClientProps {
  children: ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const { status, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    // Redirect only on a *definitive* result — never while `initializing` or on a
    // transient ME failure, which is what caused spurious bounces to /login on refresh.
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/admin');
    } else if (status === 'authenticated' && !isAdmin) {
      router.push('/');
    }
  }, [status, isAdmin, router]);

  if (status !== 'authenticated' || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/articles', label: 'Articles', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/relationship', label: 'Pins', icon: MapPin },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <aside className="w-full md:w-64 bg-card border-r">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your content</p>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                      {
                        'bg-accent text-accent-foreground': isActive,
                      },
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li className="mt-8 pt-6 border-t">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Github, Linkedin, Mail, Newspaper, type LucideIcon } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/projects', label: 'Projects' },
  { href: '/articles', label: 'Articles' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

const SOCIAL_LINKS: { href: string; label: string; icon: LucideIcon; external: boolean }[] = [
  { href: 'https://github.com/lfariabr', label: 'GitHub', icon: Github, external: true },
  { href: 'https://linkedin.com/in/lfariabr', label: 'LinkedIn', icon: Linkedin, external: true },
  { href: 'https://dev.to/lfariaus', label: 'dev.to', icon: Newspaper, external: true },
  { href: 'mailto:lfariabr@gmail.com', label: 'Email', icon: Mail, external: false },
];

const linkClass = 'text-muted-foreground hover:text-foreground transition-colors';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div>
              <p className="font-medium">Luis Faria</p>
              <p className="text-sm text-muted-foreground">Senior Software Engineer · Sydney</p>
            </div>
            <ul className="flex items-center gap-1 -ml-2" aria-label="Social">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    title={label}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`${linkClass} inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm md:flex md:flex-wrap md:justify-end md:gap-x-6">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
          <span>© {currentYear} Luis Faria</span>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from 'next';
import { Github, Linkedin, Mail, PenLine, MapPin, GraduationCap } from 'lucide-react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { SOCIALS } from '@/content/profile';

export const metadata: Metadata = {
  title: 'Contact — Luis Faria',
  description:
    'Get in touch with Luis Faria — software and data engineer in Sydney. Email, LinkedIn, GitHub, and dev.to.',
  alternates: { canonical: 'https://luisfaria.dev/contact' },
};

const LINKS = [
  { label: 'GitHub', href: SOCIALS.github, icon: Github, external: true },
  { label: 'LinkedIn', href: SOCIALS.linkedin, icon: Linkedin, external: true },
  { label: 'dev.to', href: SOCIALS.devto, icon: PenLine, external: true },
  { label: 'Master’s repo', href: SOCIALS.mastersRepo, icon: GraduationCap, external: true },
];

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-2xl px-6 py-16 space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Get in touch</h1>
          <p className="text-muted-foreground">
            Happy to talk about software, data, automation, or AI work — or just to connect. Email is
            the fastest way to reach me.
          </p>
        </div>

        <div>
          <Button asChild size="lg" className="rounded-full">
            <a href={`mailto:${SOCIALS.email}`}>
              <Mail className="mr-2 h-4 w-4" /> {SOCIALS.email}
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {LINKS.map(({ label, href, icon: Icon }) => (
            <Button key={href} asChild variant="outline" className="rounded-full">
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="mr-2 h-4 w-4" /> {label}
              </a>
            </Button>
          ))}
        </div>

        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {SOCIALS.location}
        </p>
      </div>
    </MainLayout>
  );
}

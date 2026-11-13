'use client';

import { useState } from 'react';
import { ArrowUpRight, Dumbbell, Flame, Telescope, type LucideIcon } from 'lucide-react';
import { GogginsDialog } from '@/components/goggins/GogginsDialog';
import { ApodDialog } from '@/components/apod/ApodDialog';
import { OFF_THE_CLOCK } from '@/content/profile';

const cardClass =
  'flex h-full w-full flex-col items-start rounded-2xl border bg-card p-4 text-left transition-colors hover:border-emerald-400';

function CardBody({ icon: Icon, title, blurb }: { icon: LucideIcon; title: string; blurb: string }) {
  return (
    <>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        {title}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">{blurb}</span>
    </>
  );
}

/** "Off the clock": pull-ups, Goggins mode and NASA's picture of the day (#491). */
export function OffTheClockSection() {
  const [gogginsOpen, setGogginsOpen] = useState(false);
  const [apodOpen, setApodOpen] = useState(false);
  const { pullUps, goggins, apod } = OFF_THE_CLOCK;

  return (
    <section aria-labelledby="off-the-clock-heading">
      <h2
        id="off-the-clock-heading"
        className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Off the clock
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        <li>
          <a href={pullUps.href} target="_blank" rel="noreferrer" className={cardClass}>
            <CardBody icon={Dumbbell} title={pullUps.title} blurb={pullUps.blurb} />
            <ArrowUpRight className="mt-2 h-4 w-4 text-muted-foreground" aria-hidden />
          </a>
        </li>
        <li>
          <button type="button" onClick={() => setGogginsOpen(true)} className={cardClass}>
            <CardBody icon={Flame} title={goggins.title} blurb={goggins.blurb} />
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setApodOpen(true)} className={cardClass}>
            <CardBody icon={Telescope} title={apod.title} blurb={apod.blurb} />
          </button>
        </li>
      </ul>
      <GogginsDialog open={gogginsOpen} onOpenChange={setGogginsOpen} />
      <ApodDialog open={apodOpen} onOpenChange={setApodOpen} />
    </section>
  );
}

'use client';

import { BotIcon, LockIcon, ClockIcon } from 'lucide-react';

interface ChatHeaderProps {
  limit: number;
}

export function ChatHeader({ limit }: ChatHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
          <BotIcon className="h-3.5 w-3.5" /> AI-grounded
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
          <LockIcon className="h-3.5 w-3.5" /> Private
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
          <ClockIcon className="h-3.5 w-3.5" /> {limit} msgs/hr
        </span>
      </div>
    </div>
  );
}

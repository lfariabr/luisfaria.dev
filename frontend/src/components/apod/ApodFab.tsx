"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ApodDialog } from "./ApodDialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { sendDiscordWebhook } from "@/utils/discord";

export function ApodFab() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  if (pathname && (pathname === '/notes' || pathname.startsWith('/notes/'))) return null;

  return (
    <>
      <ApodDialog open={open} onOpenChange={setOpen} />

      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative inline-flex">
                {/* emerald border ring (simple, clean) */}
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,.9), rgba(16,185,129,.35))",
                    padding: "3px",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />

                <Button
                  onClick={() => { void sendDiscordWebhook('🔭 APOD FAB clicked'); setOpen(true); }}
                  aria-label="Open Astronomy Picture of the Day"
                  className="
                    rounded-full h-20 w-20 p-0
                    bg-white dark:bg-zinc-950 
                    hover:bg-zinc-100 dark:hover:bg-zinc-900
                    shadow-xl
                    border border-zinc-200 dark:border-white/10
                  "
                >
                  <span className="relative h-16 w-16 rounded-full overflow-hidden bg-zinc-100 dark:bg-black ring-1 ring-zinc-300 dark:ring-white/15">
                    <Image
                      src="/apod.png"
                      alt="NASA APOD"
                      fill
                      sizes="64px"
                      className="object-cover rounded-full select-none pointer-events-none"
                    />
                  </span>
                </Button>

                {/* subtle emerald pulse (attention, not noise) */}
                <span className="pointer-events-none animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20" />
              </span>
            </TooltipTrigger>

            <TooltipContent
              side="left"
              className="bg-white dark:bg-zinc-950 text-zinc-700 dark:text-white/80 border border-zinc-200 dark:border-white/10"
            >
              <p>
                <span className="text-emerald-400">NASA</span> APOD
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}

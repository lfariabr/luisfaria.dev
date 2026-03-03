"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HandCoins } from "lucide-react";
import { StripeDialog } from "./StripeDialog";
import { trackClientEvent } from "@/utils/analytics";

export function StripeFab() {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
    trackClientEvent("stripe_fab_opened");
  };

  return (
    <>
      <StripeDialog open={open} onOpenChange={setOpen} />

      <div className="fixed bottom-[7.5rem] right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative inline-flex">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(245,158,11,.9), rgba(245,158,11,.35))",
                    padding: "3px",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />

                <Button
                  onClick={handleOpen}
                  aria-label="Open support checkout options"
                  className="
                    rounded-full h-20 w-20 p-0
                    bg-white dark:bg-zinc-950
                    hover:bg-zinc-100 dark:hover:bg-zinc-900
                    shadow-xl
                    border border-zinc-200 dark:border-white/10
                  "
                >
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-black ring-1 ring-zinc-300 dark:ring-white/15">
                    <HandCoins className="h-8 w-8 text-amber-500" />
                  </span>
                </Button>

                <span className="pointer-events-none animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-20" />
              </span>
            </TooltipTrigger>

            <TooltipContent
              side="left"
              className="bg-white dark:bg-zinc-950 text-zinc-700 dark:text-white/80 border border-zinc-200 dark:border-white/10"
            >
              <p>
                <span className="text-amber-500">Stripe</span> Support
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Coffee } from "lucide-react";
import { StripeDialog } from "./StripeDialog";
import { trackClientEvent } from "@/utils/analytics";
import { sendDiscordWebhook } from "@/utils/discord";

// Private pages where a support prompt has no audience and only covers the content.
const HIDDEN_ON = ['/notes', '/places'];

const isHiddenOn = (pathname: string | null) =>
  pathname !== null && HIDDEN_ON.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function StripeFab() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  if (isHiddenOn(pathname)) return null;

  const handleOpen = () => {
    setOpen(true);
    trackClientEvent("stripe_fab_opened");
    void sendDiscordWebhook('☕ Stripe FAB opened');
  };

  return (
    <>
      <StripeDialog open={open} onOpenChange={setOpen} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleOpen}
              aria-label="Open support checkout options"
              className="
                rounded-full h-14 w-14 p-0
                bg-card hover:bg-accent
                border border-border
                ring-2 ring-emerald-500/60 hover:ring-emerald-500
                ring-offset-2 ring-offset-background
                shadow-lg transition
                focus-visible:ring-emerald-500
              "
            >
              <Coffee className="h-6 w-6 text-amber-500" />
            </Button>
          </TooltipTrigger>

          <TooltipContent
            side="left"
            className="bg-card text-muted-foreground border border-border"
          >
            <p>
              <span className="text-emerald-500">Support</span> my work
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}

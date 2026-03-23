"use client";

import React from "react";
import { Coffee, CalendarClock, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStripeCheckout } from "@/lib/hooks/useStripeCheckout";
import type { StripeProductKey } from "@/lib/graphql/types/stripe.types";
import { trackClientEvent } from "@/utils/analytics";
import { sendDiscordWebhook } from "@/utils/discord";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export type StripeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PRODUCT_OPTIONS: Array<{
  key: StripeProductKey;
  title: string;
  description: string;
  amount: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "coffee",
    title: "Buy me a coffee",
    description: "A quick way to support my work.",
    amount: "AUD 5.00",
    Icon: Coffee,
  },
  {
    key: "meeting",
    title: "Book a meeting",
    description: "One focused consulting session.",
    amount: "AUD 150.00",
    Icon: CalendarClock,
  },
];

export function StripeDialog({ open, onOpenChange }: StripeDialogProps) {
  const [selected, setSelected] = React.useState<StripeProductKey | null>(null);
  const [email, setEmail] = React.useState("");
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { startCheckout, loading } = useStripeCheckout();

  React.useEffect(() => {
    if (!open) {
      setSelected(null);
      setEmail("");
      setIsRedirecting(false);
      setErrorMessage(null);
    }
  }, [open]);

  const handleSelect = (productKey: StripeProductKey) => {
    setSelected(productKey);
    setErrorMessage(null);
    trackClientEvent("stripe_item_selected", { productKey });
    void sendDiscordWebhook(`💳 Stripe option selected: ${productKey}`);
  };

  const handleContinue = async () => {
    if (!selected || loading || isRedirecting) return;
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!isValidEmail) {
        const message = "Enter a valid email or leave the field blank.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }
    }

    void sendDiscordWebhook(`💰 Stripe checkout initiated: ${selected}${trimmedEmail ? ` — ${trimmedEmail}` : ''}`);
    setIsRedirecting(true);
    const result = await startCheckout(selected, trimmedEmail);
    if (!result.ok) {
      setIsRedirecting(false);
      setErrorMessage(result.errorMessage ?? "Unable to start checkout.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-lg
          border border-zinc-200 dark:border-white/10
          bg-white/95 dark:bg-zinc-950/85
          backdrop-blur-xl
          shadow-2xl
          rounded-2xl
          overflow-hidden
          p-0
        "
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        <div className="p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5">
                <CreditCard className="h-4 w-4 text-amber-500" />
              </span>
              Support My Work
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-300">
              Choose one option and continue to Stripe secure checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-3">
            {PRODUCT_OPTIONS.map(({ key, title, description, amount, Icon }) => {
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`
                    w-full rounded-xl border p-4 text-left transition
                    ${isSelected
                      ? "border-amber-500/70 bg-amber-50/80 dark:bg-amber-500/10"
                      : "border-zinc-200 dark:border-white/10 hover:border-amber-300/70"}
                  `}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5">
                        <Icon className="h-4 w-4 text-amber-500" />
                      </span>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{title}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{amount}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <label
              htmlFor="checkout-email"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Email (optional)
            </label>
            <Input
              id="checkout-email"
              value={email}
              type="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="border-zinc-200 dark:border-white/15"
            />
          </div>

          {errorMessage ? (
            <Alert className="mt-4 border-amber-300/60 bg-amber-50/80 text-zinc-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-zinc-100">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            onClick={handleContinue}
            disabled={!selected || loading || isRedirecting}
            className="mt-6 w-full rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading || isRedirecting ? "Redirecting..." : "Continue to secure checkout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

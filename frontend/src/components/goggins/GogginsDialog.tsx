"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';
import { ACTIVATE_GOGGINS_MODE } from '@/lib/graphql/mutations/scream.mutations';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { sendDiscordWebhook } from '@/utils/discord';

const schema = z.object({
  userEmail: z.string().email('Invalid email address'),
  explicitMode: z.boolean().default(false),
});

export type GogginsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// small helper to humanize seconds (e.g., 1h 12m, 04:35)
function formatDuration(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m >= 5) return `${m}m`;
  // under 5 minutes show mm:ss
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function GogginsDialog({ open, onOpenChange }: GogginsDialogProps) {
  const [secondsUntilReset, setSecondsUntilReset] = React.useState<number | null>(null);
  const [resultText, setResultText] = React.useState<string>("");
  const [errorText, setErrorText] = React.useState<string>("");
  const [limit, setLimit] = React.useState<number | null>(null);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [showEmail, setShowEmail] = React.useState<boolean>(true);
  const { toast } = useToast();

  // useForm generics: <Input, Context, Output>
  // With zod default(), input type has optional fields while output is required.
  // Align them to fix the Resolver type mismatch.
  const form = useForm<z.input<typeof schema>, any, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { userEmail: '', explicitMode: false },
    mode: 'onSubmit',
  });

  const [mutate, { loading }] = useMutation(ACTIVATE_GOGGINS_MODE);

  // load saved email on mount
  React.useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('gogginsEmail') : null;
      if (saved) {
        form.setValue('userEmail', saved);
        setShowEmail(false);
      }
      // also load last message once on mount
      const lastMsg = typeof window !== 'undefined' ? localStorage.getItem('gogginsLastMessage') : null;
      if (lastMsg) setResultText(lastMsg);
    } catch (e) {
      // ignore
    }
  }, []);

  // load last message whenever dialog opens
  React.useEffect(() => {
    if (!open) return;
    try {
      const lastMsg = typeof window !== 'undefined' ? localStorage.getItem('gogginsLastMessage') : null;
      if (lastMsg) setResultText(lastMsg);
    } catch {}
  }, [open]);

  // countdown
  React.useEffect(() => {
    if (secondsUntilReset == null) return;
    if (secondsUntilReset <= 0) return;
    const id = setInterval(() => {
      setSecondsUntilReset((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsUntilReset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // reset state when dialog closes
      setSecondsUntilReset(null);
      setResultText("");
      setErrorText("");
      setLimit(null);
      setRemaining(null);
      // keep email hidden if we have one saved
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('gogginsEmail') : null;
        setShowEmail(!saved);
      } catch {
        setShowEmail(true);
      }
      form.reset({
        userEmail: (() => {
          try {
            return (typeof window !== 'undefined' ? localStorage.getItem('gogginsEmail') : '') || '';
          } catch {
            return '';
          }
        })(),
        explicitMode: false,
      });
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: z.output<typeof schema>) => {
    setResultText("");
    setErrorText("");
    void sendDiscordWebhook(`💪 Goggins mode: ${values.userEmail} (tone: ${values.explicitMode ? 'explicit' : 'filtered'})`);
    // persist and hide the email input to free up space
    try {
      if (values.userEmail) localStorage.setItem('gogginsEmail', values.userEmail);
    } catch {}
    setShowEmail(false);
    // Clear any stale countdown before a new attempt
    setSecondsUntilReset(null);
    try {
      const { data, errors } = await mutate({
        variables: { input: values },
        errorPolicy: 'all',
      });

      // If GraphQL returned errors with 200 OK (e.g., Shield rate limit), surface them
      const gqError = errors?.[0];
      const ext: any = gqError?.extensions;
      if (gqError) {
        if (typeof ext?.limit === 'number') setLimit(ext.limit);
        if (typeof ext?.remaining === 'number') setRemaining(ext.remaining);
        const resetInErr: number | undefined = ext?.resetIn;
        if (typeof resetInErr === 'number') setSecondsUntilReset(resetInErr);
        setErrorText(gqError.message || 'Something went wrong');
        return; // stop; we already showed the error
      }

      const scream = data?.activateGogginsMode;
      if (scream) {
        const text = String(scream.text ?? '');
        setResultText(text);
        // persist last successful message
        try { localStorage.setItem('gogginsLastMessage', text); } catch {}
        const allowed = scream.rateLimitInfo?.allowed;
        const resetIn = scream.rateLimitInfo?.resetIn as number | undefined;
        const lim = scream.rateLimitInfo?.limit as number | undefined;
        const rem = scream.rateLimitInfo?.remaining as number | undefined;
        if (typeof lim === 'number') setLimit(lim);
        if (typeof rem === 'number') setRemaining(rem);
        // Start countdown when request was blocked or when remaining hits 0 after this success
        if ((allowed === false || rem === 0) && typeof resetIn === 'number') {
          setSecondsUntilReset(resetIn);
          if (allowed === false) setErrorText('Rate limited.');
        } else {
          setSecondsUntilReset(null);
        }
      }
    } catch (e: any) {
      const ext = e?.graphQLErrors?.[0]?.extensions as any;
      if (typeof ext?.limit === 'number') setLimit(ext.limit);
      if (typeof ext?.remaining === 'number') setRemaining(ext.remaining);
      const resetIn: number | undefined = ext?.resetIn;
      if (typeof resetIn === 'number') setSecondsUntilReset(resetIn);
      const message = e?.graphQLErrors?.[0]?.message || 'Something went wrong';
      setErrorText(message);
    }
  };

  const disabled = loading || (secondsUntilReset != null && secondsUntilReset > 0);
  const used = limit != null && remaining != null ? Math.max(0, (limit as number) - (remaining as number)) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[96vw] max-w-[420px] h-auto max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Goggins Mode</DialogTitle>
          <DialogDescription asChild>
            <div>
              {/* header row with avatar to relate visually */}
              <div className="mb-2 flex items-center gap-3">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 dark:ring-white/20">
                  <Image src="/goggins.png" alt="Goggins" fill sizes="40px" className="object-cover" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Get a short, tough-love nudge to get moving.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(limit != null && remaining != null) && (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-medium">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /> Screams count
                  </span>
                  <span className="text-xs text-muted-foreground">{remaining}/{limit}</span>
                  {used != null && limit != null && (
                    <div className="ml-2 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-emerald-500" style={{ width: `${(used as number) / (limit as number) * 100}%` }} />
                    </div>
                  )}
                </div>
                {secondsUntilReset != null && secondsUntilReset > 0 && (
                  <span className="text-xs rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    + in {formatDuration(secondsUntilReset)}
                  </span>
                )}
              </div>
            )}

            {showEmail ? (
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="flex items-center justify-start">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                  {/* <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> */}
                  Saved as {form.getValues('userEmail') || 'you@example.com'}
                </span>
              </div>
            )}

            <FormField
              control={form.control}
              name="explicitMode"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-medium">Select your tone</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Toggle explicit tone" />
                    </FormControl>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {field.value ? (
                      <>
                        <span className="mr-1">🔥</span>
                        Unfiltered — Expect profanity and max intensity.
                      </>
                    ) : (
                      <>
                        <span className="mr-1">💬</span>
                        Filtered — Expect real hard truths, but respectful tone.
                      </>
                    )}
                  </p>
                </FormItem>
              )}
            />

            {resultText && (
              <div className="space-y-3">
                <FormLabel className="text-sm font-medium">Response</FormLabel>
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <div className="border-l-4 border-orange-600 px-4 py-3">
                    <blockquote className="whitespace-pre-wrap text-[0.975rem] leading-relaxed italic">
                      {resultText}
                    </blockquote>
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" size="sm" disabled className="cursor-not-allowed opacity-60">
                    Share <span className="ml-1 text-xs text-muted-foreground">(Coming soon)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(resultText);
                        toast({ title: 'Copied to clipboard' });
                      } catch (err) {
                        toast({ title: 'Copy failed', description: 'Please try again', variant: 'destructive' });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {errorText && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorText}
                  {secondsUntilReset != null && secondsUntilReset > 0 && (
                    <span> Try again in {formatDuration(secondsUntilReset)}.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button type="submit" disabled={disabled}>
                {loading
                  ? 'Generating…'
                  : secondsUntilReset
                  ? `Wait ${formatDuration(secondsUntilReset)}`
                  : remaining != null && limit != null
                  ? `Generate (${remaining}/${limit})`
                  : 'Generate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

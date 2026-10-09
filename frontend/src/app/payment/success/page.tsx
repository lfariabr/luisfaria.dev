import type { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { fetchGql } from "@/lib/graphql/fetchGql";
import { CHECKOUT_SESSION_STATUS_QUERY } from "@/lib/graphql/queries/server.queries";
import type { StripeProductKey } from "@/lib/graphql/types/stripe.types";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your Stripe payment was completed successfully.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SuccessPageProps {
  searchParams?: Promise<{ session_id?: string; return_to?: string }>;
}

interface CheckoutSessionStatusData {
  checkoutSessionStatus: {
    sessionId: string;
    paymentStatus: string;
    status: string | null;
    productKey: StripeProductKey | null;
    bookingUrl: string | null;
  };
}

function sanitizeReturnUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const allowed = new URL(frontendUrl);
    if (parsed.origin === allowed.origin) return url;
  } catch {
    // fall through
  }
  return undefined;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params?.session_id;
  const returnTo = sanitizeReturnUrl(params?.return_to);
  let sessionStatus: CheckoutSessionStatusData["checkoutSessionStatus"] | null = null;

  if (sessionId) {
    try {
      const data = await fetchGql<CheckoutSessionStatusData>(CHECKOUT_SESSION_STATUS_QUERY, {
        variables: { sessionId },
        revalidate: 0,
      });
      sessionStatus = data.checkoutSessionStatus;
    } catch {
      sessionStatus = null;
    }
  }

  const isPaid =
    sessionStatus?.paymentStatus === "paid" &&
    (sessionStatus.status === "complete" || sessionStatus.status === "open");
  const bookingUrl = isPaid ? sessionStatus?.bookingUrl : null;

  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-6 py-20">
        <div
          className={`rounded-2xl border p-8 ${
            isPaid
              ? "border-emerald-300/50 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : "border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900/70"
          }`}
        >
          <p
            className={`text-sm font-semibold uppercase tracking-wide ${
              isPaid
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {isPaid ? "Payment complete" : "Payment status unavailable"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            {isPaid ? "Thank you for your support." : "We could not verify this payment yet."}
          </h1>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            {isPaid
              ? "Your checkout was completed successfully. I appreciate your support."
              : "If you just paid, wait a moment and refresh this page. If this keeps happening, contact me and include the session ID below."}
          </p>
          {bookingUrl && (
            <div className="mt-6 rounded-xl border border-emerald-300/60 bg-white/70 p-5 dark:border-emerald-500/30 dark:bg-zinc-950/40">
              <p className="font-medium text-zinc-900 dark:text-white">Next step: pick a time for our session.</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                The booking link is also in your email, so you can come back to it later.
              </p>
              <Button asChild className="mt-4 rounded-full bg-emerald-600 px-6 text-white hover:bg-emerald-500">
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  Book your session
                </a>
              </Button>
            </div>
          )}
          {sessionId ? (
            <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
              Session ID: <span className="font-mono">{sessionId}</span>
            </p>
          ) : (
            <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
              No session ID was provided in the return URL.
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {returnTo && (
              <Button asChild className="rounded-full px-6">
                <Link href={returnTo}>Return to page</Link>
              </Button>
            )}
            <Button asChild variant={returnTo ? "outline" : "default"} className="rounded-full px-6">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/work">View my work</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your Stripe payment was completed successfully.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SuccessPageProps {
  searchParams?: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params?.session_id;

  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/70 p-8 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Payment complete
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            Thank you for your support.
          </h1>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            Your checkout was completed successfully. I appreciate your support.
          </p>
          {sessionId ? (
            <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
              Session ID: <span className="font-mono">{sessionId}</span>
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
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

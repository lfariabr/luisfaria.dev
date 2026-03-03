import type { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "Your Stripe payment was cancelled.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentCancelPage() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8 dark:border-white/10 dark:bg-zinc-900/70">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Checkout cancelled
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            No payment was processed.
          </h1>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            You can return and choose coffee or a meeting whenever you are ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6">
              <Link href="/">Try again</Link>
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

"use client";

import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Rocket, Calendar, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from '@apollo/client';
import { GET_TODAYS_APOD } from '@/lib/graphql/queries/apod.queries';
import type { Apod } from '@/lib/graphql/types/apod.types';

export type ApodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApodDialog({ open, onOpenChange }: ApodDialogProps) {
  const { data, loading, error, refetch } = useQuery<{ getTodaysApod: Apod }>(GET_TODAYS_APOD, {
    skip: !open,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const apod = data?.getTodaysApod;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          border border-zinc-200 dark:border-white/10
          bg-white/95 dark:bg-zinc-950/85
          backdrop-blur-xl
          shadow-2xl
          rounded-2xl
          overflow-hidden
          p-0
        "
      >
        {/* top accent line (matches green hero text vibe) */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        <div className="p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5">
                <Rocket className="h-4 w-4 text-emerald-400" />
              </span>

              <span>
                <span className="text-emerald-400">NASA</span>{" "}
                <span className="text-zinc-700 dark:text-white/90">
                  {loading ? "Loading..." : apod?.title ?? "Astronomy Picture of the Day"}
                </span>
              </span>
            </DialogTitle>

            <DialogDescription className="flex items-center gap-2 text-sm text-zinc-500 dark:text-white/60">
              <Calendar className="h-4 w-4" />
              {loading ? "..." : apod?.date ?? "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {/* APOD Image / Loading / Error States */}
            <div
              className="
                relative aspect-video w-full overflow-hidden rounded-xl
                border border-zinc-200 dark:border-white/10
                bg-zinc-100 dark:bg-zinc-900/40
              "
            >
              {/* subtle "space" glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_45%)]" />

              {loading && (
                <div className="relative flex h-full items-center justify-center p-4 text-center">
                  <div className="space-y-2">
                    <RefreshCw className="mx-auto h-8 w-8 text-emerald-400 animate-spin" />
                    <p className="text-sm text-zinc-600 dark:text-white/70">Loading today&apos;s APOD...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="relative flex h-full items-center justify-center p-4 text-center">
                  <div className="space-y-3">
                    <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                    <p className="text-sm text-zinc-600 dark:text-white/70">Failed to load APOD</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !error && apod && (
                apod.mediaType === 'video' ? (
                  apod.url ? (
                    <iframe
                      src={apod.url}
                      title={apod.title}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="relative flex h-full items-center justify-center p-4 text-center">
                      <div className="space-y-2">
                        <Rocket className="mx-auto h-10 w-10 text-zinc-400 dark:text-white/30" />
                        <p className="text-sm text-zinc-600 dark:text-white/70">Interactive content</p>
                        <p className="text-xs text-zinc-400 dark:text-white/45">
                          View on NASA&apos;s website
                        </p>
                      </div>
                    </div>
                  )
                ) : apod.url ? (
                  <Image
                    src={apod.url}
                    alt={apod.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="relative flex h-full items-center justify-center p-4 text-center">
                    <div className="space-y-2">
                      <Rocket className="mx-auto h-10 w-10 text-zinc-400 dark:text-white/30" />
                      <p className="text-sm text-zinc-600 dark:text-white/70">Interactive content</p>
                      <p className="text-xs text-zinc-400 dark:text-white/45">
                        View on NASA&apos;s website
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Explanation */}
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-white/65 line-clamp-4">
              {loading ? "Loading explanation..." : apod?.explanation ?? ""}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                className="
                  gap-2
                  border-zinc-200 dark:border-white/15
                  bg-zinc-100 dark:bg-white/5
                  text-zinc-700 dark:text-white/80
                  hover:bg-zinc-200 dark:hover:bg-white/10
                  hover:text-zinc-900 dark:hover:text-white
                "
                asChild
                disabled={!apod}
              >
                <a href={apod?.apodUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Visit APOD
                </a>
              </Button>

              <p className="text-xs text-zinc-400 dark:text-white/45">
                Powered by NASA Open APIs
              </p>
            </div>
          </div>
        </div>

        {/* bottom fade (matches site's soft depth) */}
        <div className="h-10 w-full bg-gradient-to-b from-transparent to-zinc-100/50 dark:to-black/30" />
      </DialogContent>
    </Dialog>
  );
}
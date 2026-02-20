"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Rocket, Calendar, ExternalLink, AlertCircle, RefreshCw, Lock, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from '@apollo/client';
import { GET_TODAYS_APOD, GET_APOD_BY_DATE } from '@/lib/graphql/queries/apod.queries';
import type { Apod } from '@/lib/graphql/types/apod.types';
import { useAuth } from '@/lib/auth/AuthContext';
import { trackClientEvent } from '@/utils/analytics';

export type ApodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FIRST_APOD_DATE = '1995-06-16';
const READ_MORE_CHAR_THRESHOLD = 400; // ~5-7 lines of text
const MAX_HEIGHT_COLLAPSED = '120px'; // ~5 lines
const MAX_HEIGHT_EXPANDED = '400px'; // Scrollable

// Helper to format countdown duration
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m >= 5) return `${m}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTodayDateString(): string {
  // return new Date().toISOString().split('T')[0];
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function ApodDialog({ open, onOpenChange }: ApodDialogProps) {
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);
  
  // Rate limit state (for authenticated historical browsing)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    limit: number;
    remaining: number;
    resetTime: string;
  } | null>(null);
  const [secondsUntilReset, setSecondsUntilReset] = useState<number | null>(null);
  const [previousDate, setPreviousDate] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedDate(null);
      setRateLimitInfo(null);
      setSecondsUntilReset(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    trackClientEvent('apod_opened', { isAuthenticated });
  }, [open, isAuthenticated]);

  const todayStr = useMemo(() => getTodayDateString(), [open]);
  const isHistorical = selectedDate !== null && selectedDate !== todayStr;

  const { data: todayData, loading: todayLoading, error: todayError, refetch: refetchToday } = useQuery<{ getTodaysApod: Apod }>(GET_TODAYS_APOD, {
    skip: !open || isHistorical,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const { data: dateData, loading: dateLoading, error: dateError, refetch: refetchDate } = useQuery<{ getApodByDate: Apod }>(GET_APOD_BY_DATE, {
    skip: !open || !isHistorical,
    variables: { date: selectedDate },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const loading = isHistorical ? dateLoading : todayLoading;
  const error = isHistorical ? dateError : todayError;
  const apod = isHistorical ? dateData?.getApodByDate : todayData?.getTodaysApod;
  const refetch = isHistorical ? refetchDate : refetchToday;
  
  // Rate limit derived state
  const isRateLimited = secondsUntilReset !== null && secondsUntilReset > 0;
  const isRateLimitError = dateError?.graphQLErrors?.[0]?.extensions?.code === 'RATE_LIMIT_EXCEEDED';

  // Extract rate limit info from GraphQL errors
  useEffect(() => {
    if (dateError) {
      const gqlError = dateError.graphQLErrors?.[0];
      const ext = gqlError?.extensions as Record<string, unknown> | undefined;
      if (ext?.code === 'RATE_LIMIT_EXCEEDED') {
        const limit = ext.limit as number;
        const remaining = ext.remaining as number;
        const resetTime = ext.resetTime as string;
        setRateLimitInfo({ limit, remaining, resetTime });
        // Calculate seconds until reset
        const resetMs = new Date(resetTime).getTime() - Date.now();
        setSecondsUntilReset(Math.max(0, Math.ceil(resetMs / 1000)));

        trackClientEvent('apod_rate_limit_exhausted', {
          date: selectedDate,
          limit,
          remaining,
          resetTime,
        });
      }
    }
  }, [dateError, selectedDate]);

  // Track successful APOD fetches
  useEffect(() => {
    if (!open) return;
    if (!apod) return;
    if (!apod.date) return;

    trackClientEvent('apod_fetch_success', {
      date: apod.date,
      mediaType: apod.mediaType,
      isHistorical,
    });
  }, [open, apod, isHistorical]);

  // Track fetch errors (excluding rate limit which has its own event)
  useEffect(() => {
    if (!open) return;
    if (!error) return;
    if (isHistorical && isRateLimitError) return;

    const extCode = error.graphQLErrors?.[0]?.extensions?.code;
    trackClientEvent('apod_fetch_error', {
      date: selectedDate,
      isHistorical,
      errorCode: typeof extCode === 'string' ? extCode : undefined,
    });
  }, [open, error, isHistorical, isRateLimitError, selectedDate]);

  // Countdown timer for rate limit reset
  useEffect(() => {
    if (secondsUntilReset === null || secondsUntilReset <= 0) return;
    const id = setInterval(() => {
      setSecondsUntilReset(prev => {
        if (prev === null || prev <= 1) {
          // Reset rate limit state when countdown ends
          setRateLimitInfo(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsUntilReset]);

  // Reset rate limit state when dialog closes
  useEffect(() => {
    if (!open) {
      setRateLimitInfo(null);
      setSecondsUntilReset(null);
    }
  }, [open]);

  // Check if explanation text exceeds threshold
  useEffect(() => {
    if (apod?.explanation) {
      // Primary check: character count threshold
      const isLong = apod.explanation.length > READ_MORE_CHAR_THRESHOLD;
      
      // Secondary check: visual overflow (scroll height vs client height)
      if (explanationRef.current) {
        const scrollHeight = explanationRef.current.scrollHeight;
        const clientHeight = explanationRef.current.clientHeight;
        const hasVisualOverflow = scrollHeight > clientHeight;
        setShouldShowReadMore(isLong || hasVisualOverflow);
      } else {
        setShouldShowReadMore(isLong);
      }
    } else {
      setShouldShowReadMore(false);
      setIsExpanded(false);
    }
  }, [apod?.explanation]);

  // Reset expansion state when dialog closes or apod changes
  useEffect(() => {
    if (!open) {
      setIsExpanded(false);
    }
  }, [open]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPreviousDate(selectedDate);
    setSelectedDate(value || null);

    trackClientEvent('apod_date_changed', {
      date: value || null,
    });
  };

  const handleRestorePreviousDate = () => {
    setSelectedDate(previousDate);
    setPreviousDate(null);
    setRateLimitInfo(null);
    setSecondsUntilReset(null);
  };

  const handleResetToToday = () => {
    setSelectedDate(null);
  };

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

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

            <DialogDescription asChild>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-white/60">
                  <Calendar className="h-4 w-4" />
                  {loading ? "..." : apod?.date ?? "—"}
                  {isHistorical && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToToday}
                      className="h-6 px-2 text-xs text-emerald-500 hover:text-emerald-400"
                    >
                      ← Today
                    </Button>
                  )}
                </div>
                
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        aria-label="Select APOD date"
                        value={selectedDate ?? ''}
                        onChange={handleDateChange}
                        min={FIRST_APOD_DATE}
                        max={todayStr}
                        disabled={isRateLimited}
                        className={`
                          h-8 px-2 text-xs rounded-md
                          border border-zinc-200 dark:border-white/15
                          bg-zinc-50 dark:bg-white/5
                          text-zinc-700 dark:text-white/80
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                          ${isRateLimited ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      />
                      <span className="text-xs text-zinc-400 dark:text-white/40">
                        {isRateLimited ? 'Rate limit reached' : 'Explore historical APODs'}
                      </span>
                    </div>
                    
                    {/* Rate Limit Badge - only shown when rate limited */}
                    {isRateLimited && rateLimitInfo && (
                      <div className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5">
                        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          {rateLimitInfo.remaining}/{rateLimitInfo.limit} requests
                        </span>
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Resets in {formatCountdown(secondsUntilReset ?? 0)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/40">
                    <Lock className="h-3 w-3" />
                    <span>Login to explore historical APODs</span>
                  </div>
                )}
              </div>
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
                    <p className="text-sm text-zinc-600 dark:text-white/70">
                      {isHistorical ? `Loading APOD for ${selectedDate}...` : "Loading today's APOD..."}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="relative flex h-full items-center justify-center p-4 text-center">
                  <div className="space-y-3">
                    {isRateLimitError ? (
                      <>
                        <Clock className="mx-auto h-8 w-8 text-amber-500" />
                        <p className="text-sm text-zinc-600 dark:text-white/70">
                          Rate limit reached
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-white/50">
                          Try again in {formatCountdown(secondsUntilReset ?? 0)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRestorePreviousDate}
                          className="gap-2 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                        >
                          Oops, you&apos;ve hit your limit... view previous image?
                        </Button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
                      sandbox="allow-scripts allow-same-origin allow-presentation"
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

            {/* Explanation - Scrollable with Read More */}
            <div className="space-y-2">
              <div
                ref={explanationRef}
                className={`
                  text-sm leading-relaxed text-zinc-600 dark:text-white/65
                  overflow-y-auto
                  transition-all duration-300 ease-in-out
                  ${!isExpanded && shouldShowReadMore ? 'line-clamp-5' : ''}
                  pr-2
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded
                `}
                style={{
                  maxHeight: isExpanded ? MAX_HEIGHT_EXPANDED : MAX_HEIGHT_COLLAPSED,
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(212, 212, 216, 0.5) transparent',
                }}
                tabIndex={isExpanded ? 0 : -1}
                aria-label="APOD explanation text"
              >
                {loading ? "Loading explanation..." : apod?.explanation ?? ""}
              </div>
              
              {shouldShowReadMore && !loading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpanded}
                  className="
                    w-full gap-2
                    text-xs
                    text-emerald-500 hover:text-emerald-400
                    dark:text-emerald-400 dark:hover:text-emerald-300
                    h-7
                    focus:ring-2 focus:ring-emerald-500/50
                  "
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Read less" : "Read more"}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Read Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Read More
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              {apod ? (
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
                >
                  <a href={apod.apodUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Visit APOD
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="
                    gap-2
                    border-zinc-200 dark:border-white/15
                    bg-zinc-100 dark:bg-white/5
                    text-zinc-700 dark:text-white/80
                    pointer-events-none
                  "
                  disabled
                  aria-disabled="true"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit APOD
                </Button>
              )}

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
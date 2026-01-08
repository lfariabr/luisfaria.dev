"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Rocket, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ApodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApodDialog({ open, onOpenChange }: ApodDialogProps) {
  // TODO: Fetch real APOD data from NASA API or backend
  const apodData = {
    title: "Astronomy Picture of the Day",
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    explanation:
      "Discover the cosmos! Each day a different image or photograph of our fascinating universe is featured, along with a brief explanation written by a professional astronomer.",
    url: "https://apod.nasa.gov/apod/astropix.html",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          border border-white/10
          bg-zinc-950/85
          backdrop-blur-xl
          shadow-2xl
          rounded-2xl
          overflow-hidden
          p-0
        "
      >
        {/* top accent line (matches green hero text vibe) */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Rocket className="h-4 w-4 text-emerald-400" />
              </span>

              <span>
                <span className="text-emerald-400">NASA</span>{" "}
                <span className="text-white/90">{apodData.title}</span>
              </span>
            </DialogTitle>

            <DialogDescription className="flex items-center gap-2 text-sm text-white/60">
              <Calendar className="h-4 w-4" />
              {apodData.date}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {/* Placeholder for APOD image (subtle, premium, not loud) */}
            <div
              className="
                relative aspect-video w-full overflow-hidden rounded-xl
                border border-white/10
                bg-zinc-900/40
              "
            >
              {/* subtle “space” glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_45%)]" />

              <div className="relative flex h-full items-center justify-center p-4 text-center">
                <div className="space-y-2">
                  <Rocket className="mx-auto h-10 w-10 text-white/30" />
                  <p className="text-sm text-white/70">APOD image will appear here</p>
                  <p className="text-xs text-white/45">
                    Coming soon: daily NASA imagery + explanation
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/65">
              {apodData.explanation}
            </p>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="outline"
                size="sm"
                className="
                  gap-2
                  border-white/15
                  bg-white/5
                  text-white/80
                  hover:bg-white/10
                  hover:text-white
                "
                asChild
              >
                <a href={apodData.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Visit APOD
                </a>
              </Button>

              <p className="text-xs text-white/45">
                Powered by NASA Open APIs
              </p>
            </div>
          </div>
        </div>

        {/* bottom fade (matches site’s soft depth) */}
        <div className="h-10 w-full bg-gradient-to-b from-transparent to-black/30" />
      </DialogContent>
    </Dialog>
  );
}
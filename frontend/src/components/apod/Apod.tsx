"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function Apod() {
    const [ open, setOpen ] = React.useState(false);
    
    return (
        // TODO: Add <ApodDialog open={open} onOpenChange={setOpen} /> 
        <div className="fixed bottom-6 right-6 z-50">
            <span className="relative inline-flex">
                <Button onClick={() => setOpen(true)}
                    className="rounded-full h-20 w-20 p-0 shadow-xl"
                    aria-label="Activate APoD Mode"
                >
                <span className="relative h-16 w-16 rounded-full overflow-hidden bg-white ring-2 ring-black/10 dark:ring-white/20">
                <Image
                src="/apod.png"
                alt="Apod"
                fill
                sizes="64px"
                className="object-cover rounded-full select-none pointer-events-none"
                />
                </span>
                </Button>
                <span className="pointer-events-none animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20" />
            </span>
        </div>
    );
}
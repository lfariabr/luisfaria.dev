'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SessionRetryProps {
  message?: string;
  onRetry: () => void | Promise<void>;
}

/**
 * Shown on protected routes when the session could not be *verified* due to a
 * transient network/server failure (auth `status === 'error'`). This is NOT a
 * logout — the user keeps a valid cookie — so we offer a retry instead of
 * redirecting to /login.
 */
export function SessionRetry({ message, onRetry }: SessionRetryProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ?? "We couldn't verify your session. Check your connection and try again."}
      </p>
      <Button onClick={handleRetry} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Retry'}
      </Button>
    </div>
  );
}

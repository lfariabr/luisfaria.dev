'use client';

import { forwardRef, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const ChatComposer = forwardRef<HTMLFormElement, ChatComposerProps>(
  ({ input, isLoading, onInputChange, onSubmit }, ref) => (
    <form ref={ref} onSubmit={onSubmit} className="border-t p-4 flex gap-3">
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading || !input.trim()}
        className="rounded-full h-12 w-12"
      >
        <SendIcon className="h-4 w-4" />
      </Button>
    </form>
  )
);

ChatComposer.displayName = 'ChatComposer';

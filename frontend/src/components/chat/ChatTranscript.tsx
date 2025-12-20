'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { BotIcon } from 'lucide-react';
import { MarkdownMessage } from './MarkdownMessage';
import { ChatMessage } from './types';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  isLoading: boolean;
  profileInitials: string;
}

export const ChatTranscript = forwardRef<HTMLDivElement, ChatTranscriptProps>(
  ({ messages, isLoading, profileInitials }, ref) => {
    const getAvatarLabel = (source?: string): string => {
      const trimmed = source?.trim();
      if (!trimmed) return '?';
      if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const segments: string[] = [];
        for (const { segment } of segmenter.segment(trimmed)) {
          const clean = segment.trim();
          if (!clean) continue;
          segments.push(clean);
          if (segments.length === 2) break;
        }
        return segments.join('') || '?';
      }
      const chars = Array.from(trimmed).filter((ch) => ch.trim());
      if (!chars.length) return '?';
      return (chars[0] ?? '') + (chars[1] ?? '');
    };

    const userInitials = getAvatarLabel(profileInitials);

    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
      >
        {messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const previous = messages[index - 1];
          const showAvatar = !previous || previous.sender !== message.sender;

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isUser ? 'justify-end text-right' : 'justify-start text-left'
              )}
            >
              {!isUser && showAvatar && (
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <BotIcon className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border',
                  isUser
                    ? 'bg-gradient-to-r from-primary to-blue-500 text-primary-foreground border-primary/40'
                    : 'bg-muted text-foreground border-transparent'
                )}
              >
                <MarkdownMessage
                  content={message.content}
                  className={isUser ? 'text-primary-foreground' : ''}
                />
                <p className={cn('text-[11px] mt-2', isUser ? 'text-white/70' : 'text-muted-foreground')}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {isUser && showAvatar && (
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase">
                  {userInitials}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
            <span>Assistant composing...</span>
          </div>
        )}
      </div>
    );
  }
);

ChatTranscript.displayName = 'ChatTranscript';

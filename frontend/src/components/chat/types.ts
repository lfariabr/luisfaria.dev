'use client';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatRateLimitInfo {
  remaining: number;
  resetTime?: Date;
  limit?: number;
}

export type RateStatus = 'ok' | 'warning' | 'blocked' | 'guest';

export interface UsageHistoryEntry {
  id: string;
  description: string;
  timestamp: Date;
}

export interface RateNotice {
  id: string;
  tone: 'info' | 'warning' | 'success';
  message: string;
}

'use client';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatRateLimitInfo {
  remaining: number;
  resetTime: string;
  limit?: number;
}

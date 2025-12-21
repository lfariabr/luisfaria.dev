'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MainLayout } from "@/components/layouts/MainLayout";
import { useAuth } from '@/lib/auth/AuthContext';
import { gql, useMutation } from '@apollo/client';
import { sendDiscordWebhook } from '@/utils/discord';
import { InfoRail } from '@/components/chat/InfoRail';
import { ChatTranscript } from '@/components/chat/ChatTranscript';
import { ChatSuggestions } from '@/components/chat/ChatSuggestions';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { RateNotices } from '@/components/chat/RateNotices';
import type { ChatMessage, ChatRateLimitInfo, UsageHistoryEntry, RateNotice, RateStatus } from '@/components/chat/types';

const DEFAULT_RATE_LIMIT = 5;

// GraphQL mutation for sending a message to the chatbot
const ASK_QUESTION_MUTATION = gql`
  mutation AskQuestion($question: String!) {
    askQuestion(question: $question) {
      message {
        id
        question
        answer
        modelUsed
        createdAt
      }
      rateLimitInfo {
        remaining
        resetTime
      }
    }
  }
`;

export default function ChatbotPage() {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m Luis\'s AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<ChatRateLimitInfo | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
  const [rateNotices, setRateNotices] = useState<RateNotice[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const previousStatusRef = useRef<RateStatus>('guest');

  // Update countdown timer for rate limit reset
  useEffect(() => {
    const resetTime = rateLimitInfo?.resetTime;
    if (!resetTime) {
      setTimeUntilReset('');
      return;
    }
    
    const calculateTimeRemaining = () => {
      const diffMs = resetTime.getTime() - Date.now();
      if (diffMs <= 0) {
        setRateLimitInfo((prev) => {
          if (!prev) return null;
          const nextLimit = prev.limit ?? DEFAULT_RATE_LIMIT;
          return {
            ...prev,
            remaining: nextLimit,
            resetTime: undefined,
          };
        });
        pushUsageEvent('Window refreshed');
        pushRateNotice({
          tone: 'success',
          message: 'Rate limit reset. You are clear to continue.',
        });
        setTimeUntilReset('');
        return;
      }
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      setTimeUntilReset(`${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`);
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [rateLimitInfo?.resetTime]);

  // Scroll to latest message whenever the transcript updates
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Setup GraphQL mutation
  const [askQuestion] = useMutation(ASK_QUESTION_MUTATION, {
    onCompleted: (data) => {
      if (data?.askQuestion) {
        // Update rate limit info
        if (data.askQuestion.rateLimitInfo) {
          const info = data.askQuestion.rateLimitInfo;
          setRateLimitInfo({
            remaining: typeof info.remaining === 'number' ? info.remaining : 0,
            limit: typeof info.limit === 'number' ? info.limit : DEFAULT_RATE_LIMIT,
            resetTime: info.resetTime ? new Date(info.resetTime) : undefined,
          });
        }
        
        // Add bot response
        const botResponse: ChatMessage = {
          id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: data.askQuestion.message?.answer || "Sorry, I couldn't process your request.",
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Chatbot API error:', error);
      
      let errorMessage = error.message;
      let resetTimeString = '';
      
      // Extract rate limit information from the error
      if (error.graphQLErrors?.length > 0) {
        const graphQLError = error.graphQLErrors[0];
        
        if (graphQLError.extensions?.code === 'RATE_LIMITED') {
          const ext = graphQLError.extensions as Record<string, unknown> | undefined;
          const extReset = ext?.resetTime;
          if (typeof extReset === 'string') {
            resetTimeString = extReset;
          }
          const limitFromError = typeof ext?.limit === 'number' ? ext.limit : DEFAULT_RATE_LIMIT;
          const remainingFromError = typeof ext?.remaining === 'number' ? ext.remaining : 0;
          setRateLimitInfo({
            remaining: remainingFromError,
            limit: limitFromError,
            resetTime: resetTimeString ? new Date(resetTimeString) : undefined,
          });
          errorMessage = `You have reached your ${DEFAULT_RATE_LIMIT} messages/hour limit.`;
        }
      }
      
      // Add error message from the bot
      const botErrorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: errorMessage === 'Rate limit exceeded' 
          ? `You have reached your ${DEFAULT_RATE_LIMIT} messages/hour limit. Please try again later.` 
          : `Oops! ${errorMessage}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botErrorMessage]);
      setIsLoading(false);
    }
  });

  const pushUsageEvent = useCallback((description: string) => {
    setUsageHistory((prev) => {
      const next: UsageHistoryEntry[] = [
        ...prev,
        { id: `usage-${Date.now()}`, description, timestamp: new Date() },
      ];
      return next.slice(-5);
    });
  }, []);

  const activeTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  useEffect(() => {
    return () => {
      // Clear all pending timeouts on unmount
      activeTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      activeTimeoutsRef.current.clear();
    }
  }, []);

  const pushRateNotice = useCallback((notice: Omit<RateNotice, 'id'>) => {
    const id = `notice-${Date.now()}`;
    setRateNotices((prev) => [...prev, { ...notice, id }]);
    const timeoutId = setTimeout(() => {
      setRateNotices((prev) => prev.filter((n) => n.id !== id));
      activeTimeoutsRef.current.delete(id);
    }, 4000);
    activeTimeoutsRef.current.set(id, timeoutId);
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLoading) return;
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    pushUsageEvent('Message sent');

    void sendDiscordWebhook('Chatbot message submitted').catch((err) => {
      console.error('sendDiscordWebhook failed:', err);
    });
    
    if (isAuthenticated) {
      try {
        // Send message to API if user is authenticated
        await askQuestion({
          variables: { question: trimmedInput }
        });
      } catch (error) {
        // Error is handled by onError in the mutation setup
        console.error('Error sending message:', error);
      }
    } else {
      // Simulate API response delay for non-authenticated users
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: `You need to be logged in to use this feature. Authenticated users can send up to 5 messages per hour. Please log in to continue.`,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Set the input field with the suggestion
    setInput(suggestion);
    
    // Auto-submit after a short delay (like ChatGPT)
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 100);
  };

  const limit = rateLimitInfo?.limit ?? DEFAULT_RATE_LIMIT;
  // Before first API response, assume full quota for authenticated users
  const remaining = rateLimitInfo ? rateLimitInfo.remaining : (isAuthenticated ? limit : 0);
  const rateStatus: RateStatus = useMemo(() => {
    if (!isAuthenticated) return 'guest';
    // Only show blocked if we actually have rate limit info confirming 0 remaining
    if (rateLimitInfo && rateLimitInfo.remaining <= 0) return 'blocked';
    if (rateLimitInfo && rateLimitInfo.remaining <= Math.ceil(limit * 0.2)) return 'warning';
    return 'ok';
  }, [isAuthenticated, rateLimitInfo, limit]);

  useEffect(() => {
    const previous = previousStatusRef.current;
    if (rateStatus !== previous) {
      previousStatusRef.current = rateStatus;
      if (rateStatus === 'warning') {
        pushRateNotice({
          tone: 'warning',
          message: `You're nearing the hourly cap. ${remaining} message(s) left.`,
        });
      } else if (rateStatus === 'blocked') {
        pushRateNotice({
          tone: 'warning',
          message: `Rate limit reached. Next message in ${timeUntilReset || 'a moment'}.`,
        });
        pushUsageEvent('Rate limit reached');
      }
    }
  }, [rateStatus, remaining, timeUntilReset, pushRateNotice, pushUsageEvent]);

  const profileInitials = useMemo(() => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'LF';
  }, [user]);

  const displayName = isAuthenticated ? user?.name ?? user?.email ?? 'Member' : 'Guest Explorer';
  const suggestions = useMemo(
    () => [
      "What's Luis shipping right now?",
      'Summarize his AI roadmap',
      'What is Luis background?',
      'How does Luis scale React apps?',
    ],
    []
  );

  return (
    <MainLayout>
      <RateNotices notices={rateNotices} />
      <div className="container py-4 md:py-8 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col lg:grid lg:gap-10 lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[360px_1fr] gap-4">
          <InfoRail
            profileInitials={profileInitials}
            displayName={displayName}
            isAuthenticated={isAuthenticated}
            remaining={remaining}
            limit={limit}
            timeUntilReset={timeUntilReset}
            rateLimitResetTime={rateLimitInfo?.resetTime ?? null}
            defaultLimit={DEFAULT_RATE_LIMIT}
            status={rateStatus}
            usageHistory={usageHistory}
          />

          <section className="space-y-6">
            <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-5">
              <ChatHeader limit={limit} />
              <div className="border rounded-2xl bg-background">
                <div className="flex flex-col h-[70vh]">
                  {rateStatus !== 'ok' && rateStatus !== 'guest' && (
                    <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between">
                      <span>
                        {rateStatus === 'warning'
                          ? `You're close to the cap. ${remaining} message(s) left.`
                          : `Temporarily paused. Next message in ${timeUntilReset || 'a moment'}.`}
                      </span>
                      <span className="text-xs text-amber-700">
                        {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Watching load'}
                      </span>
                    </div>
                  )}
                  <ChatTranscript
                    ref={messagesContainerRef}
                    messages={messages}
                    isLoading={isLoading}
                    profileInitials={profileInitials}
                  />
                  <ChatSuggestions suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                  <ChatComposer
                    ref={formRef}
                    input={input}
                    isLoading={isLoading}
                    onInputChange={setInput}
                    onSubmit={handleSendMessage}
                  />
                </div>
              </div>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground text-center space-y-1 md:space-y-2">
              <p className="hidden md:block">This AI assistant is powered by a custom model trained on Luis' technical expertise and preferences.</p>
              <p className="hidden md:block">All conversations are private and not stored longer than needed to provide the service.</p>
              {rateLimitInfo?.resetTime && rateLimitInfo.remaining <= 0 && (
                <p className="text-amber-500">Rate limit reached. Next message available in {timeUntilReset}.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
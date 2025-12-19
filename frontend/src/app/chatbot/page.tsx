'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MainLayout } from "@/components/layouts/MainLayout";
import { useAuth } from '@/lib/auth/AuthContext';
import { gql, useMutation } from '@apollo/client';
import { sendDiscordWebhook } from '@/utils/discord';
import { InfoRail } from '@/components/chat/InfoRail';
import { ChatTranscript } from '@/components/chat/ChatTranscript';
import { ChatSuggestions } from '@/components/chat/ChatSuggestions';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import type { ChatMessage, ChatRateLimitInfo } from '@/components/chat/types';

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
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Update countdown timer for rate limit reset
  useEffect(() => {
    if (!rateLimitResetTime) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const resetTime = new Date(rateLimitResetTime);
      const diffMs = resetTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setRateLimitResetTime(null);
        setTimeUntilReset('');
        return;
      }
      
      // Calculate minutes and seconds
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffSeconds = Math.floor((diffMs % 60000) / 1000);
      
      // Format as MM:SS
      setTimeUntilReset(`${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`);
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [rateLimitResetTime]);

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
          setRateLimitInfo(data.askQuestion.rateLimitInfo);
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
            setRateLimitResetTime(new Date(resetTimeString));
          }
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

  const handleButtonClick = async () => {
    await sendDiscordWebhook('Chatbot button was clicked');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (isAuthenticated) {
      try {
        // Send message to API if user is authenticated
        await askQuestion({
          variables: { question: input.trim() }
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
  const remaining = rateLimitInfo?.remaining ?? DEFAULT_RATE_LIMIT;
  const used = Math.max(0, limit - remaining);
  const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

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
      <div className="container py-8 px-4 max-w-7xl mx-auto">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[360px_1fr]">
          <InfoRail
            profileInitials={profileInitials}
            displayName={displayName}
            isAuthenticated={isAuthenticated}
            remaining={remaining}
            limit={limit}
            usagePercent={usagePercent}
            timeUntilReset={timeUntilReset}
            rateLimitResetTime={rateLimitResetTime}
            defaultLimit={DEFAULT_RATE_LIMIT}
          />

          <section className="space-y-6">
            <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-5">
              <ChatHeader limit={limit} />
              <div className="border rounded-2xl bg-background">
                <div className="flex flex-col h-[70vh]">
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
                    onSendClick={handleButtonClick}
                  />
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p>This AI assistant is powered by a custom model trained on Luis' technical expertise and preferences.</p>
              <p>All conversations are private and not stored longer than needed to provide the service.</p>
              {rateLimitResetTime && (
                <p className="text-amber-500">Rate limit reached. Next message available in {timeUntilReset}.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
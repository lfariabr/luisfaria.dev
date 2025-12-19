'use client';

import { useState, useEffect, useRef } from 'react';
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, BotIcon, UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { gql, useMutation } from '@apollo/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarkdownMessage } from '@/components/chat/MarkdownMessage';
import { sendDiscordWebhook } from '@/utils/discord';
import { LockIcon, ClockIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface RateLimitInfo {
  remaining: number;
  resetTime: string;
  limit?: number;
}

export default function ChatbotPage() {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Luis\'s AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Update countdown timer for rate limit reset
  useEffect(() => {
    if (!rateLimitResetTime) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const resetTime = new Date(rateLimitResetTime);
      const diffMs = resetTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setRateLimitError(null);
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
        const botResponse: Message = {
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
          errorMessage = 'You have reached your 5 messages/hour limit.';
          setRateLimitError(errorMessage);
        }
      }
      
      // Add error message from the bot
      const botErrorMessage: Message = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: errorMessage === 'Rate limit exceeded' 
          ? `You have reached your 5 messages/hour limit. Please try again later.` 
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
    const userMessage: Message = {
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
        const botResponse: Message = {
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
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  const limit = rateLimitInfo?.limit ?? DEFAULT_RATE_LIMIT;
  const remaining = rateLimitInfo?.remaining ?? DEFAULT_RATE_LIMIT;
  const used = Math.max(0, limit - remaining);
  const usagePercent = Math.min(100, (used / limit) * 100);

  const profileInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LF';

  return (
    <MainLayout>
      <div className="container py-8 px-4 max-w-7xl mx-auto">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[360px_1fr]">
          {/* Info Rail */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-8 self-start">
            {/* Profile Block */}
            <section className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 mb-3">
                Luis Faria • AI Command Center
              </p>
              <h1 className="text-3xl font-semibold leading-tight">
                Personal AI Assistant
              </h1>
              <p className="mt-3 text-sm text-white/80">
                Ask anything about my shipping history, architecture decisions, or leadership philosophy. Replies are grounded in my real portfolio.
              </p>
            </section>

            <section className="border rounded-2xl p-5 bg-card shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center text-lg font-semibold text-primary uppercase">
                  {profileInitials}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="text-base font-semibold">
                    {isAuthenticated ? user?.name ?? user?.email ?? 'Member' : 'Guest Explorer'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? 'Full access unlocked' : 'Log in for 5 authenticated messages/hr'}
                  </p>
                </div>
              </div>
            </section>

            {/* Rate Limit Module */}
            <section className="border rounded-2xl p-5 space-y-4 bg-muted/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Usage Window
                  </p>
                  <p className="text-2xl font-semibold">
                    {isAuthenticated ? `${remaining}/${limit}` : `0/${DEFAULT_RATE_LIMIT}`}
                  </p>
                </div>
                <span className="text-[11px] bg-white/60 dark:bg-slate-900/60 border rounded-full px-3 py-1 text-muted-foreground">
                  {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Fresh window'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAuthenticated
                    ? remaining > 0
                      ? 'Still clear to keep chatting.'
                      : 'Limit hit. Breathe for a minute, then try again.'
                    : 'Authenticate to start using your message window.'}
                </p>
              </div>
            </section>

            {!isAuthenticated && (
              <section className="border rounded-2xl p-5 bg-blue-50/70 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-white/70 dark:bg-blue-900/40">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Sign in to chat with Luis' AI Assistant
                      </h3>
                      <p className="text-sm text-blue-800/80 dark:text-blue-200/80">
                        Create an account to unlock full conversations (5 messages/hour).
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="sm">
                        <a href="/login">Log in</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/register">Create account</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {isAuthenticated && rateLimitInfo?.remaining === 0 && rateLimitResetTime && (
              <section className="border rounded-2xl p-4 bg-amber-50 dark:bg-amber-900/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Rate limit reached
                    </p>
                    <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                      Next message available in {timeUntilReset}.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>

          {/* Conversation Column */}
          <section className="space-y-6">
            <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <BotIcon className="h-3.5 w-3.5" /> AI-grounded
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <LockIcon className="h-3.5 w-3.5" /> Private
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                    <ClockIcon className="h-3.5 w-3.5" /> {limit} msgs/hr
                  </span>
                </div>
              </div>

              <div className="border rounded-2xl bg-background">
                <div className="flex flex-col h-[70vh]">
                  <div
                    ref={messagesContainerRef}
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
                              {profileInitials.slice(0, 2)}
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

                  {/* Suggestions */}
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Quick prompts
                      </p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        "What's Luis shipping right now?",
                        'Summarize his AI roadmap',
                        'What is Luis background?',
                        'How does Luis scale React apps?',
                      ].map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => handleSuggestionClick(question)}
                          className="text-sm border rounded-full px-4 py-2 hover:border-primary transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isLoading || !input.trim()}
                      onClick={handleButtonClick}
                      className="rounded-full h-12 w-12"
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </form>
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
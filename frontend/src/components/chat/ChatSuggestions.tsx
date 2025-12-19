'use client';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatSuggestions({ suggestions, onSuggestionClick }: ChatSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Quick prompts
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {suggestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSuggestionClick(question)}
            className="text-sm border rounded-full px-4 py-2 hover:border-primary transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot, User, Zap } from 'lucide-react';
import { getChemistryResponse, suggestedPrompts } from '@/lib/chemistryEngine';
import { streamChat, type ChatMessage } from '@/lib/aiChat';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'offline' | 'ai';
}

export function ChemistryAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your **Chemistry Assistant** powered by AI. Ask me anything about chemistry — formulas, concepts, reactions, calculations, and more!',
      timestamp: new Date(),
      source: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (useAI) {
      // Build conversation history for AI
      const history: ChatMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: messageText });

      let assistantSoFar = '';
      const assistantId = `assistant-${Date.now()}`;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { id: assistantId, role: 'assistant' as const, content: assistantSoFar, timestamp: new Date(), source: 'ai' as const }];
        });
      };

      try {
        await streamChat({
          messages: history,
          onDelta: (chunk) => upsertAssistant(chunk),
          onDone: () => setIsTyping(false),
          onError: (error) => {
            toast.error(error);
            // Fallback to offline engine
            const response = getChemistryResponse(messageText);
            setMessages(prev => [...prev, {
              id: assistantId,
              role: 'assistant',
              content: response,
              timestamp: new Date(),
              source: 'offline',
            }]);
            setIsTyping(false);
          },
        });
      } catch (e) {
        console.error(e);
        const response = getChemistryResponse(messageText);
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          source: 'offline',
        }]);
        setIsTyping(false);
      }
    } else {
      // Offline engine
      setTimeout(() => {
        const response = getChemistryResponse(messageText);
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          source: 'offline',
        }]);
        setIsTyping(false);
      }, 300);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: useAI
        ? 'Chat cleared! Ask me anything about chemistry.'
        : 'Chat cleared! Using offline engine. Ask me about formulas or concepts.',
      timestamp: new Date(),
      source: useAI ? 'ai' : 'offline',
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Chemistry Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {useAI ? '🟢 AI Powered' : '⚫ Offline Engine'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseAI(!useAI)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              useAI
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
            title={useAI ? 'Switch to offline mode' : 'Switch to AI mode'}
          >
            <Zap className="w-3.5 h-3.5" />
            {useAI ? 'AI On' : 'AI Off'}
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="max-w-[80%]">
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-card border border-border text-card-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              {msg.source && msg.role === 'assistant' && (
                <span className="text-[10px] text-muted-foreground mt-1 ml-1 inline-block">
                  {msg.source === 'ai' ? '✨ AI' : '📦 Offline'}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 py-3">
          {suggestedPrompts.slice(0, 4).map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-full text-xs border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border mt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about chemistry — formulas, reactions, concepts..."
          className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

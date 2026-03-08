import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot, User, Zap, Info, X } from 'lucide-react';
import { getChemistryResponse, suggestedPrompts } from '@/lib/chemistryEngine';
import { streamChat, generateItem, isGenerationRequest, type ChatMessage, type GeneratedItem } from '@/lib/aiChat';
import { addGeneratedItem } from '@/lib/aiItemStore';
import { GeneratedItemCard } from './GeneratedItemCard';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Track AI usage in localStorage
function getAIUsage(): { count: number; resetDate: string } {
  try {
    const stored = localStorage.getItem('chemassist-ai-usage');
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if past reset date
      if (new Date(data.resetDate) <= new Date()) {
        const newData = { count: 0, resetDate: getNextResetDate() };
        localStorage.setItem('chemassist-ai-usage', JSON.stringify(newData));
        return newData;
      }
      return data;
    }
  } catch {}
  const data = { count: 0, resetDate: getNextResetDate() };
  localStorage.setItem('chemassist-ai-usage', JSON.stringify(data));
  return data;
}

function getNextResetDate(): string {
  const now = new Date();
  const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return reset.toISOString();
}

function incrementAIUsage(): number {
  const usage = getAIUsage();
  usage.count++;
  localStorage.setItem('chemassist-ai-usage', JSON.stringify(usage));
  return usage.count;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'offline' | 'ai';
  generatedItem?: GeneratedItem;
  itemConfirmed?: boolean;
  itemDismissed?: boolean;
}

export function ChemistryAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your **Chemistry Assistant** powered by AI.\n\nI can answer questions, **generate SOPs**, **create formulas**, and **add chemicals to your inventory**.\n\nTry: *"Generate SOP for pH determination"* or *"Add NaOH to inventory"*',
      timestamp: new Date(),
      source: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [aiUsage, setAiUsage] = useState(() => getAIUsage());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConfirm = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.generatedItem) return;

    const success = addGeneratedItem(msg.generatedItem);
    if (success) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, itemConfirmed: true } : m));
      const labels = { generate_sop: 'SOP', generate_formula: 'Formula', generate_inventory_item: 'Inventory Item' };
      toast.success(`${labels[msg.generatedItem.type]} added successfully!`);
    } else {
      toast.error('Failed to add item. Please try again.');
    }
  };

  const handleDismiss = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, itemDismissed: true } : m));
  };

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
      const newCount = incrementAIUsage();
      setAiUsage(getAIUsage());
      const history: ChatMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: messageText });

      // Check if this is a generation request
      if (isGenerationRequest(messageText)) {
        try {
          const result = await generateItem(history);
          const assistantId = `assistant-${Date.now()}`;

          if (result.type === 'text') {
            setMessages(prev => [...prev, {
              id: assistantId,
              role: 'assistant',
              content: result.text,
              timestamp: new Date(),
              source: 'ai',
            }]);
          } else {
            const genItem = result as GeneratedItem;
            const labels = { generate_sop: 'SOP', generate_formula: 'Formula', generate_inventory_item: 'chemical' };
            const itemName = (genItem.data as Record<string, unknown>).name as string;
            setMessages(prev => [...prev, {
              id: assistantId,
              role: 'assistant',
              content: genItem.text || `Here's the generated **${labels[genItem.type]}**: **${itemName}**. Review it below and click "Add" to save it.`,
              timestamp: new Date(),
              source: 'ai',
              generatedItem: genItem,
            }]);
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'AI generation failed';
          toast.error(errMsg);
          // Fallback to offline
          const response = getChemistryResponse(messageText);
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            source: 'offline',
          }]);
        }
        setIsTyping(false);
        return;
      }

      // Regular streaming chat
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
        ? 'Chat cleared! Ask me anything, or try generating SOPs, formulas, or inventory items.'
        : 'Chat cleared! Using offline engine.',
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
              {useAI ? '🟢 AI Powered • SOPs • Formulas • Inventory' : '⚫ Offline Engine'}
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
          >
            <Zap className="w-3.5 h-3.5" />
            {useAI ? 'AI On' : 'AI Off'}
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
            <div className="max-w-[85%] space-y-2">
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

              {/* Generated Item Card */}
              {msg.generatedItem && !msg.itemDismissed && (
                <GeneratedItemCard
                  item={msg.generatedItem}
                  onConfirm={() => handleConfirm(msg.id)}
                  onDismiss={() => handleDismiss(msg.id)}
                  confirmed={msg.itemConfirmed}
                />
              )}

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
          {[
            "Generate SOP for pH determination",
            "Add Na2SO4 to inventory",
            "Create formula for percent recovery",
            "What is Beer-Lambert law?",
          ].map((prompt) => (
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
          placeholder={useAI ? "Ask, generate SOPs, add chemicals..." : "Ask about chemistry..."}
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

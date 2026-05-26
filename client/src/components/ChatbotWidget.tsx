import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, List, Search, Clock } from 'lucide-react';
import { chatWithAI } from '../services/aiService';
import { api } from '../lib/api';
import { User } from '../types';

interface ChatbotWidgetProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

export default function ChatbotWidget({ user, onNavigate }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'How can I help?' },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!user || user.role !== 'student') return;
    const fetchHistory = async () => {
      try {
        const history = await api.getChatHistory(user.id);
        if (Array.isArray(history) && history.length) {
          setMessages(
            history.map((h: any) => ({ role: h.role, content: stripMarkdown(String(h.content || '')) }))
          );
        }
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    };
    fetchHistory();
  }, [user]);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  if (user && user.role !== 'student') return null;

  const quickActions = [
    { label: 'Lost', icon: <List size={14} />, msg: 'How do I report a lost item?' },
    { label: 'Found', icon: <Search size={14} />, msg: "I found an item, what next?" },
    { label: 'Claim', icon: <Clock size={14} />, msg: 'How can I claim an item?' },
  ];

  const handleSend = async (custom?: string) => {
    const text = (custom ?? input).trim();
    if (!text || isLoading) return;
    if (!custom) setInput('');

    const updated = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setIsLoading(true);
    try {
      const historyForAI = updated.map((m) => ({ role: m.role, parts: [{ text: m.content }] }));
      const firstUserIndex = historyForAI.findIndex((h) => h.role === 'user');
      const filtered = firstUserIndex === -1 ? [] : historyForAI.slice(firstUserIndex, -1);
      const resp = await chatWithAI(text, filtered);
      const cleaned = stripMarkdown(String(resp || ''));
      const finalMessages = [...updated, { role: 'model', content: cleaned }];
      setMessages(finalMessages);
      await saveHistory(finalMessages);
    } catch (e) {
      setMessages((p) => [...p, { role: 'model', content: 'Sorry, something went wrong.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = async (newMessages: { role: 'user' | 'model'; content: string }[]) => {
    if (!user) return;
    try {
      await api.saveChatHistory(user.id, newMessages);
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  };

  function stripMarkdown(text: string) {
    if (!text) return '';
    let out = text.replace(/```[\s\S]*?```/g, '');
    out = out.replace(/`([^`]+)`/g, '$1');
    out = out.replace(/\*\*(.*?)\*\*/g, '$1');
    out = out.replace(/\*(.*?)\*/g, '$1');
    out = out.replace(/__(.*?)__/g, '$1');
    out = out.replace(/_(.*?)_/g, '$1');
    out = out.replace(/^#{1,6}\s*/gm, '');
    out = out.replace(/!\[(.*?)\]\((.*?)\)/g, '$1');
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
    out = out.replace(/^[\s]*[-*+]\s+/gm, '• ');
    out = out.replace(/\n{2,}/g, '\n');
    return out.trim();
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] font-sans sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mb-4 flex h-[min(520px,calc(100vh-6rem))] w-[calc(100vw-2rem)] max-w-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg sm:w-[480px] md:h-[600px]"
          >
            <div className="flex items-center justify-between px-5 py-3 bg-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="text-base font-semibold text-fg">Campus Assistant</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-2 text-muted transition-colors hover:bg-surface/10 hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow space-y-3 overflow-y-auto bg-bg/10 px-5 py-5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm leading-6 ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-fg shadow-sm'
                        : 'rounded-bl-md bg-surface text-fg ring-1 ring-border'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-surface-raised px-4 py-2 text-sm text-muted">Thinking…</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-3">
              <div className="flex gap-2">
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => handleSend(qa.msg)}
                    title={qa.label}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-fg"
                  >
                    {qa.icon}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
            </div>

            <form
              onSubmit={(e) => {
                 e.preventDefault();
                handleSend();
              }}
              className="border-t border-border bg-surface px-5 pb-4 pt-3"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about items..."
                  className="w-full rounded-lg bg-bg py-2.5 pl-4 pr-14 text-sm text-fg ring-1 ring-border placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md bg-primary text-primary-fg transition-opacity disabled:opacity-50 shadow-sm"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-3 text-center text-[11px] text-muted">{user ? user.name : 'Campus Chat'}</div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen((s) => !s)}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-black/15 transition-all duration-200 ${
          isOpen ? 'border border-border bg-surface-raised text-fg' : 'bg-primary text-primary-fg'
        }`}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User as UserIcon, List, Search, Clock } from 'lucide-react';
import { chatWithAI } from '../services/aiService';
import { api } from '../lib/api';
import { User } from '../types';

interface ChatbotWidgetProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

export default function ChatbotWidget({ user, onNavigate }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hi! I'm your Campus Lost & Found assistant. How can I help you today?" }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (user && user.role === 'student') {
      const fetchHistory = async () => {
        try {
          const history = await api.getChatHistory(user.id);
          if (history.length > 0) {
            setMessages(history);
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      };
      fetchHistory();
    }
  }, [user]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  React.useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-campus-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-campus-chat', handleOpenChat);
    };
  }, []);

  if (user && user.role !== 'student') return null;

  const saveHistory = async (newMessages: { role: 'user' | 'model', content: string }[]) => {
    if (!user) return;
    try {
      await api.saveChatHistory(user.id, newMessages);
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  };

  const handleSend = async (customMessage?: string) => {
    const userMessage = customMessage || input.trim();
    if (!userMessage || isLoading) return;

    if (!customMessage) setInput('');
    
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const historyForAI = updatedMessages.map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: m.content }]
      }));

      const firstUserIndex = historyForAI.findIndex(h => h.role === 'user');
      const filteredHistory = firstUserIndex === -1 ? [] : historyForAI.slice(firstUserIndex, -1);

      const response = await chatWithAI(userMessage, filteredHistory);
      const finalMessages = [...updatedMessages, { role: 'model' as const, content: response }];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I hit a snag. Could you try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Lost Item", icon: <List size={14} />, action: () => { handleSend("Step-by-step: How do I report a lost item?"); setIsOpen(true); } },
    { label: "Found Item", icon: <Search size={14} />, action: () => { handleSend("I just found someone's stuff. What do I do now?"); } },
    { label: "Claiming Help", icon: <Clock size={14} />, action: () => { handleSend("How can I prove an item is mine?"); } },
    { label: "Admin Workflow", icon: <Bot size={14} />, action: () => { handleSend("Explain the manual approval process."); } },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[60] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-surface rounded-3xl  border ring-border flex flex-col overflow-hidden"
          >
            <div className="bg-primary p-4 text-primary-fg flex items-center justify-between ">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center ">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm leading-tight">Campus Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-medium text-primary-fg/70">AI Powered • Personalized</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-surface/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-grow p-4 overflow-y-auto space-y-4 bg-bg/50"
            >
              {messages.map((m, i) => (
                <div 
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-fg rounded-tr-none' 
                      : 'bg-surface text-fg shadow-sm border ring-border rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface p-3 rounded-2xl rounded-tl-none shadow-sm border ring-border flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-surface-raised rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-surface-raised rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-surface-raised rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-surface flex gap-2 overflow-x-auto no-scrollbar border-t ring-border">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={qa.action}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-bg hover:bg-primary/5 hover:text-primary text-muted rounded-full text-[11px] font-bold border ring-border transition-all"
                >
                  {qa.icon}
                  {qa.label}
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-surface border-t ring-border">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about items, rules..."
                  className="w-full pl-4 pr-12 py-3 bg-bg border ring-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1.5 p-1.5 bg-primary text-primary-fg rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-muted mt-3 flex items-center justify-center gap-1">
                <span>{user ? `Personalized for ${user.name}` : "Campus Chat Assistant"}</span>
                <span>•</span>
                <span>Gemini Pro</span>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center  transition-all duration-300 ${
          isOpen ? 'bg-surface-raised text-fg' : 'bg-primary text-primary-fg hover:opacity-90'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-primary-fg animate-bounce"></span>
        )}
      </motion.button>
    </div>
  );
}

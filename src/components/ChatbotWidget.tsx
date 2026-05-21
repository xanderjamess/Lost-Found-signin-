import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User as UserIcon, List, Search, Clock } from 'lucide-react';
import { chatWithAI } from '../services/aiService';
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

  // Load history from server
  React.useEffect(() => {
    if (user && user.role === 'student') {
      const fetchHistory = async () => {
        try {
          const response = await fetch(`/api/chat-history/${user.id}`);
          if (response.ok) {
            const history = await response.json();
            if (history.length > 0) {
              setMessages(history);
            }
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

  // Hook up event listener to open chatbot from external components
  React.useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-campus-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-campus-chat', handleOpenChat);
    };
  }, []);

  // Allow student and guest users, but hide for admin who has their own dashboard flows
  if (user && user.role !== 'student') return null;

  const saveHistory = async (newMessages: { role: 'user' | 'model', content: string }[]) => {
    if (!user) return;
    try {
      await fetch(`/api/chat-history/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: newMessages })
      });
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
            className="mb-4 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight">Campus Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-medium text-white/70">AI Powered • Personalized</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <div 
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={qa.action}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-primary/5 hover:text-primary text-slate-600 rounded-full text-[11px] font-bold border border-slate-200 transition-all"
                >
                  {qa.icon}
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white border-t border-slate-100">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about items, rules..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
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
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/30'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white animate-bounce"></span>
        )}
      </motion.button>
    </div>
  );
}

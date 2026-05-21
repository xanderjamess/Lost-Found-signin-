import React from 'react';
import { Search, Camera, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onReportLost: () => void;
  onReportFound: () => void;
  onSearch: () => void;
  onOpenImageSearch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Hero({ onReportLost, onReportFound, onSearch, onOpenImageSearch, searchQuery, setSearchQuery }: HeroProps) {
  return (
    <div className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-24 sm:pb-32 min-h-[80vh] flex items-center">
      {/* Background Image with Blue Tint */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://bupcvmgo.weebly.com/uploads/6/5/0/9/65099011/bu-torch-of-wisdom_1_orig.jpg" 
          alt="Campus Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-white"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-7xl font-display font-extrabold text-white tracking-tight mb-6 drop-shadow-sm">
              Campus E-Lost and Found
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/90 mb-10 drop-shadow-sm font-medium">
              Find, report, and recover lost items faster using AI-powered image matching. Designed for a safer, smarter campus.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
          >
            <button 
              onClick={onReportLost}
              className="w-full sm:w-auto btn-primary flex items-center justify-center py-4 px-10 text-lg shadow-xl shadow-primary/30"
            >
              Report Lost Item
              <ArrowRight size={20} className="ml-2" />
            </button>
            <button 
              onClick={onReportFound}
              className="w-full sm:w-auto btn-accent flex items-center justify-center py-4 px-10 text-lg shadow-xl shadow-accent/30"
            >
              Report Found Item
              <Zap size={20} className="ml-2" />
            </button>
          </motion.div>

          {/* Quick Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-3xl mx-auto glass-card p-2 sm:p-3 flex items-center shadow-2xl mb-20 bg-white/90 backdrop-blur-xl border-white/50"
          >
            <div className="flex-grow flex items-center px-4">
              <Search className="text-slate-400 mr-3" size={20} />
              <input 
                type="text" 
                placeholder="Search for lost items (e.g., 'blue water bottle')..." 
                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
            </div>
            <div className="hidden sm:flex items-center space-x-2 border-l border-slate-100 pl-4 pr-2">
              <button 
                onClick={onOpenImageSearch}
                className="p-2 text-slate-400 hover:text-primary transition-colors" 
                title="Search by Image"
              >
                <Camera size={20} />
              </button>
            </div>
            <button 
              onClick={onSearch}
              className="btn-primary py-2.5 px-8 ml-2"
            >
              Search
            </button>
          </motion.div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Zap className="text-accent" size={32} />,
                title: "AI Image Recognition",
                desc: "Upload a photo to find possible matches instantly using our advanced AI matching algorithm."
              },
              {
                icon: <ShieldCheck className="text-emerald-500" size={32} />,
                title: "Secure Claims",
                desc: "Manual verification and automated history tracking ensure that items are returned safely."
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#blueGreenGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle">
                    <defs>
                      <linearGradient id="blueGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1E40AF" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                ),
                title: "AI Student Assistant",
                desc: "Get instant help, report guidance, and claim assistance through your personal AI chatbot.",
                onClick: () => {
                  window.dispatchEvent(new CustomEvent('open-campus-chat'));
                }
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                onClick={feature.onClick}
                className={`glass-card p-8 text-left hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 bg-white/80 ${
                  feature.onClick ? 'cursor-pointer hover:border-primary/20' : ''
                }`}
              >
                <div className="mb-6 p-3 bg-slate-50 w-fit rounded-2xl group-hover:bg-white transition-colors shadow-sm">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

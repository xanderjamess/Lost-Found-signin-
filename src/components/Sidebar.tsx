import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, LogOut } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface SidebarGroup {
  title: string;
  tabs: Tab[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ groups, activeTab, onTabChange, userName, userEmail, userRole, onLogout, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
      {/* User Profile Section - More Compact */}
      <div className="px-6 py-5 border-b border-slate-50">
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm border border-primary/5">
              {userName?.charAt(0) || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{userName || 'User'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none">{userRole || 'Student'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.title && (
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-primary/5 text-primary' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider flex-grow text-left transition-colors ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {tab.label}
                    </span>
                    
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold min-w-[18px] text-center ${
                        isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}

                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-50 bg-slate-50/30">
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm mb-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Status</p>
          <div className="flex items-center text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            AI Engine Online
          </div>
        </div>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  </>
);
}

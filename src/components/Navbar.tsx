import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, User, Menu, X, Package } from 'lucide-react';
import { User as UserType, Notification } from '../types';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  user: UserType | null;
  onNavigate: (page: string) => void;
  currentPage: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export default function Navbar({ 
  user, 
  onNavigate, 
  currentPage, 
  notifications, 
  onMarkAsRead, 
  onClearAllNotifications, 
  onNotificationClick 
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Search', id: 'search' },
    { name: 'Report', id: 'report' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', id: 'admin' });
  } else if (user) {
    navItems.push({ name: 'Dashboard', id: 'dashboard' });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl mr-3 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Package size={22} />
              </div>
              <span className="text-slate-900 font-display font-bold text-xl hidden sm:block tracking-tight">
                Campus E-Lost and Found
              </span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-bold uppercase tracking-widest transition-all ${
                    currentPage === item.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-primary hover:border-slate-200'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user && (
              <>
                <div className="relative">
                  <button 
                    className="p-2 text-slate-400 hover:text-primary transition-colors relative"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  <NotificationDropdown 
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                    onClearAll={onClearAllNotifications}
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    onNotificationClick={onNotificationClick}
                  />
                </div>
              </>
            )}
            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-7 h-7 rounded-full border border-white shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 hidden lg:block uppercase tracking-wider leading-none">{user.name}</span>
                    <span className="text-[9px] text-slate-400 hidden lg:block leading-none mt-0.5">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('logout')}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login-form')}
                className="btn-primary text-xs py-2 px-6"
              >
                Login
              </button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden gap-2">
            {user && (
              <>
                <div className="relative">
                  <button 
                    className="p-2 text-slate-400 hover:text-primary transition-colors relative"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  
                  <NotificationDropdown 
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                    onClearAll={onClearAllNotifications}
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    onNotificationClick={onNotificationClick}
                  />
                </div>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 focus:outline-none transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left pl-3 pr-4 py-3 border-l-4 text-sm font-bold uppercase tracking-widest transition-all ${
                    currentPage === item.id
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200 hover:text-primary'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            {user && (
              <div className="pt-4 pb-3 border-t border-slate-100">
                <div className="flex items-center px-4 mb-4">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full border border-slate-100" src={user.avatar} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button 
                    onClick={() => {
                      onNavigate('logout');
                      setIsOpen(false);
                    }}
                    className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-xl uppercase tracking-widest text-xs hover:bg-red-100 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
            {!user && (
              <div className="px-4 pb-4">
                <button 
                  onClick={() => {
                    onNavigate('login-form');
                    setIsOpen(false);
                  }}
                  className="w-full py-3 btn-primary uppercase tracking-widest text-xs"
                >
                  Login
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

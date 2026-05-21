import React from 'react';
import { Bell, Check, Trash2, Info, Zap, AlertCircle, X } from 'lucide-react';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export default function NotificationDropdown({ 
  notifications, 
  onMarkAsRead, 
  onClearAll,
  isOpen,
  onClose,
  onNotificationClick
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match': return <Zap className="text-accent" size={16} />;
      case 'status-update': return <Check className="text-accent-secondary" size={16} />;
      case 'system': return <Info className="text-primary" size={16} />;
      default: return <AlertCircle className="text-slate-400" size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClearAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 flex gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        onMarkAsRead(notification.id);
                        onNotificationClick(notification);
                        onClose();
                      }}
                    >
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.read ? 'bg-white shadow-sm' : 'bg-slate-100'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-grow">
                        <p className={`text-sm leading-tight mb-1 ${!notification.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(notification.date).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-2 w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Bell size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">All caught up!</p>
                  <p className="text-xs text-slate-400">No new notifications.</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
                <button 
                  onClick={onClose}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Close Panel
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

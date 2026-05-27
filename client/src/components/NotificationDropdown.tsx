import { Bell, Check, Info, Zap, AlertCircle, X } from "lucide-react";
import { Notification } from "../types";
import { motion, AnimatePresence } from "motion/react";

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
  onNotificationClick,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "match":
        return <Zap className="text-accent" size={16} />;
      case "status-update":
        return <Check className="text-success" size={16} />;
      case "system":
        return <Info className="text-primary" size={16} />;
      default:
        return <AlertCircle className="text-muted" size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl bg-surface ring-1 ring-border sm:w-96"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-fg">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="badge bg-primary text-primary-fg">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClearAll} className="text-xs text-muted hover:text-danger">
                  Clear all
                </button>
                <button type="button" onClick={onClose} className="btn-ghost p-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-raised ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          onMarkAsRead(notification.id);
                          onNotificationClick(notification);
                          onClose();
                        }}
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                          {getIcon(notification.type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className={`text-sm ${!notification.read ? "font-medium text-fg" : "text-muted"}`}>
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(notification.date).toLocaleString()}
                          </p>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-12 text-center">
                  <Bell size={28} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm text-muted">No notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

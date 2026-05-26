import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Menu, Package, X } from "lucide-react";
import { User as UserType, Notification } from "../types";
import NotificationDropdown from "./NotificationDropdown";
import ThemeToggle from "./ThemeToggle";

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
  onNotificationClick,
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { name: "Home", id: "home" },
    { name: "Search", id: "search" },
    { name: "Report", id: "report" },
  ];

  if (user?.role === "admin") {
    navItems.push({ name: "Admin", id: "admin" });
  } else if (user) {
    navItems.push({ name: "Dashboard", id: "dashboard" });
  }

  return (
    <header className="sticky top-0 z-50 bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 text-fg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Package size={18} />
          </span>
          <span className="hidden text-sm font-semibold sm:block">Campus Lost & Found</span>
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={currentPage === item.id ? "nav-link-active" : "nav-link"}
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {user && (
            <div className="relative">
              <button
                type="button"
                className="btn-ghost relative p-2"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
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
          )}

          {user ? (
            <div className="hidden items-center gap-3 pl-2 sm:flex">
              <div className="flex items-center gap-2">
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full bg-surface-raised" />
                <span className="max-w-[120px] truncate text-sm font-medium text-fg">{user.name}</span>
              </div>
              <button type="button" onClick={() => onNavigate("logout")} className="btn-ghost text-danger">
                Log out
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => onNavigate("login-form")} className="btn-primary hidden sm:inline-flex">
              Log in
            </button>
          )}

          <button
            type="button"
            className="btn-ghost p-2 sm:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-surface sm:hidden"
          >
            <div className="space-y-1 px-5 pb-6 pt-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left ${currentPage === item.id ? "nav-link-active" : "nav-link"}`}
                >
                  {item.name}
                </button>
              ))}
              {user ? (
                <button type="button" onClick={() => onNavigate("logout")} className="nav-link w-full text-danger">
                  Log out
                </button>
              ) : (
                <button type="button" onClick={() => onNavigate("login-form")} className="btn-primary mt-2 w-full">
                  Log in
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

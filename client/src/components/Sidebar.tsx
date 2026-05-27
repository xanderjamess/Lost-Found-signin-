import { motion, AnimatePresence } from "motion/react";
import { LucideIcon, LogOut } from "lucide-react";

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
  userRole?: string;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  groups,
  activeTab,
  onTabChange,
  userName,
  userRole,
  onLogout,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-fg/40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface transition-transform duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6">
          <p className="font-semibold text-fg">{userName || "User"}</p>
          <p className="mt-1 text-sm text-muted">{userRole || "Student"}</p>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto px-3 pb-6">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.title && (
                <p className="mb-2 px-3 text-xs font-medium text-muted">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted hover:bg-surface-raised hover:text-fg"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
                            isActive ? "bg-primary text-primary-fg" : "bg-surface-raised text-muted"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {onLogout && (
          <div className="p-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

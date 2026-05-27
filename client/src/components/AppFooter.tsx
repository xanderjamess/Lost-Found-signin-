import { Package } from "lucide-react";

interface AppFooterProps {
  onNavigate: (page: string) => void;
  onReportLost: () => void;
  onReportFound: () => void;
  onAdminLogin: () => void;
}

export default function AppFooter({ onNavigate, onReportLost, onReportFound, onAdminLogin }: AppFooterProps) {
  return (
    <footer className="mt-24 bg-surface">
      <div className="page flex flex-col gap-12 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <Package size={18} />
            </span>
            <span className="font-semibold text-fg">Campus Lost & Found</span>
          </div>
          <p className="mt-4 text-sm text-muted">
            Report and recover lost items on campus.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <p className="text-sm font-medium text-fg">Navigate</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <button type="button" onClick={() => onNavigate("home")} className="hover:text-fg">
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate("search")} className="hover:text-fg">
                  Search
                </button>
              </li>
              <li>
                <button type="button" onClick={onReportLost} className="hover:text-fg">
                  Report lost
                </button>
              </li>
              <li>
                <button type="button" onClick={onReportFound} className="hover:text-fg">
                  Report found
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-fg">Admin</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <button type="button" onClick={onAdminLogin} className="hover:text-fg">
                  Staff login
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <p className="text-xs text-muted">© {new Date().getFullYear()} Campus Lost & Found</p>
      </div>
    </footer>
  );
}

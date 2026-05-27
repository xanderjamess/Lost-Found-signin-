import { useCallback, useEffect, useState } from "react";
import { isUserAdmin } from "../lib/admin";
import type { User } from "../types";
import type { ToastType } from "./useToast";

function initialPage(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith('/admin')) {
    return "admin";
  }
  return "home";
}

function isAdminPath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith('/admin');
}

export function usePageRouting(
  user: User | null,
  authLoading: boolean,
  logout: () => Promise<void>,
  showToast: (message: string, type?: ToastType) => void
) {
  const [isAdminPage] = useState(isAdminPath);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loginRole, setLoginRole] = useState<"student" | "admin" | null>(null);
  const [adminTab, setAdminTab] = useState("overview");

  // Map direct URLs to SPA pages on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = window.location.pathname;
    if (p === '/' || p === '') return;
    if (p.startsWith('/admin')) { setCurrentPage('admin'); return; }
    if (p.startsWith('/search')) { setCurrentPage('search'); return; }
    if (p.startsWith('/report')) { setCurrentPage('report'); return; }
    if (p.startsWith('/dashboard')) { setCurrentPage('dashboard'); return; }
    if (p.startsWith('/login') || p.startsWith('/login-form')) { setCurrentPage('login-form'); return; }
    if (p.startsWith('/signup')) { setCurrentPage('signup'); return; }
    setCurrentPage('not-found');
  }, []); // runs once on mount only

  useEffect(() => {
  if (authLoading) return;

  if (user) {
    if (isUserAdmin(user)) {
      if (currentPage !== 'admin') setCurrentPage('admin');
    } else {
      if (currentPage === 'admin' || currentPage === 'login-form' || currentPage === 'home' || currentPage === "signup") {
        setCurrentPage('dashboard');
      }
    }
  } else {
    if (currentPage === 'admin' || currentPage === 'dashboard') {
      setCurrentPage('home');
    }
  }
}, [user, authLoading]);

  const handleNavigate = useCallback(
    async (page: string) => {
      if (page === "logout") {
        await logout();
        setCurrentPage("home");
      } else {
        setCurrentPage(page);
      }
      window.scrollTo(0, 0);
    },
    [logout]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentPage("home");
    window.scrollTo(0, 0);
  }, [logout]);

  const handleLoginSuccess = useCallback(() => {
    // Just call setCurrentPage — the useEffect above will handle admin vs student routing
    // once AuthContext updates the user object
    showToast("Successfully logged in!", "success");
    window.scrollTo(0, 0);
  }, [showToast]);

  return {
    currentPage,
    setCurrentPage,
    loginRole,
    setLoginRole,
    adminTab,
    setAdminTab,
    handleNavigate,
    handleLogout,
    handleLoginSuccess,
  };
}
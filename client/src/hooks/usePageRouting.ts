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
    if (p === '/' || p === '') return; // Home is default
    if (p.startsWith('/admin')) {
      setCurrentPage('admin');
      return;
    }
    if (p.startsWith('/search')) {
      setCurrentPage('search');
      return;
    }
    if (p.startsWith('/report')) {
      setCurrentPage('report');
      return;
    }
    if (p.startsWith('/dashboard')) {
      setCurrentPage('dashboard');
      return;
    }
    if (p.startsWith('/login') || p.startsWith('/login-form')) {
      setCurrentPage('login-form');
      return;
    }
    if (p.startsWith('/signup')) {
      setCurrentPage('signup');
      return;
    }
    // Unknown path -> show not-found
    setCurrentPage('not-found');
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (isUserAdmin(user)) {
        if (!isAdminPage) {
          if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
            // Update URL without reloading and let SPA show admin
            window.history.replaceState(null, '', '/admin');
          }
          setCurrentPage('admin');
        } else if (currentPage !== 'admin') {
          setCurrentPage('admin');
        }
      } else if (isAdminPage) {
        // Non-admin landed on /admin — move them to home without reload
        window.history.replaceState(null, '', '/');
        setCurrentPage('home');
      } else if (currentPage === 'admin' || currentPage === 'home' || currentPage === 'login-form') {
        setCurrentPage('dashboard');
      }
    } else if (isAdminPage) {
      // Not logged in and on /admin — show home (no reload)
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
      setCurrentPage('home');
    } else if (currentPage === 'admin' || currentPage === 'dashboard') {
      setCurrentPage('home');
    }
  }, [user, authLoading, isAdminPage, currentPage]);

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
    if (isUserAdmin(user)) {
      window.location.href = "/admin";
    } else {
      setCurrentPage("dashboard");
      showToast("Successfully logged in!", "success");
      window.scrollTo(0, 0);
    }
  }, [user, showToast]);

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

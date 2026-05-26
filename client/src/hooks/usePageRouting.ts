import { useCallback, useEffect, useState } from "react";
import { isUserAdmin } from "../lib/admin";
import type { User } from "../types";
import type { ToastType } from "./useToast";

function initialPage(): string {
  if (typeof window !== "undefined" && window.location.pathname.includes("admin.html")) {
    return "admin";
  }
  return "home";
}

function isAdminPath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.includes("admin.html");
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

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (isUserAdmin(user)) {
        if (!isAdminPage) {
          window.location.href = "/admin.html";
        } else if (currentPage !== "admin") {
          setCurrentPage("admin");
        }
      } else if (isAdminPage) {
        window.location.href = "/";
      } else if (currentPage === "admin" || currentPage === "home" || currentPage === "login-form") {
        setCurrentPage("dashboard");
      }
    } else if (isAdminPage) {
      window.location.href = "/";
    } else if (currentPage === "admin" || currentPage === "dashboard") {
      setCurrentPage("home");
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
      window.location.href = "/admin.html";
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

import React, { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import ReportForm from "./components/ReportForm";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ItemDetailsModal from "./components/ItemDetailsModal";
import ChatbotWidget from "./components/ChatbotWidget";
import ImageSearchModal from "./components/ImageSearchModal";
import AppFooter from "./components/AppFooter";
import ToastBanner from "./components/ToastBanner";
import OfflineBanner from "./components/OfflineBanner";
import LoadingScreen from "./components/LoadingScreen";
import SearchPage from "./pages/SearchPage";
import ReportPage from "./pages/ReportPage";
import NotFound from "./components/NotFound";
import { useAuth } from "./contexts/AuthContext";
import { filterItems } from "./lib/filterItems";
import { useFirestoreOffline } from "./hooks/useFirestoreOffline";
import { useFirestoreData } from "./hooks/useFirestoreData";
import { useNotifications } from "./hooks/useNotifications";
import { useToast } from "./hooks/useToast";
import { usePageRouting } from "./hooks/usePageRouting";
import { useCampusMutations } from "./hooks/useCampusMutations";
import type { Item } from "./types";

export default function AppContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const { toast, showToast } = useToast();
  const isOffline = useFirestoreOffline();
  const { items, users, claims, comments } = useFirestoreData(user, authLoading);

  const [showReportForm, setShowReportForm] = useState<"lost" | "found" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  const {
    currentPage,
    setCurrentPage,
    loginRole,
    setLoginRole,
    adminTab,
    setAdminTab,
    handleNavigate,
    handleLogout,
    handleLoginSuccess,
  } = usePageRouting(user, authLoading, logout, showToast);

  const notificationNav = useMemo(
    () => ({
      setCurrentPage,
      setAdminTab,
      setSelectedItem,
      items,
    }),
    [items, setCurrentPage, setAdminTab]
  );

  const {
    notifications,
    handleMarkAsRead,
    handleClearAllNotifications,
    handleNotificationClick,
  } = useNotifications(user, notificationNav);

  const {
    handleUpdateItem,
    handleReportSubmit,
    handlePostComment,
    handleDeleteComment,
    handleUpdateComment,
    handleClaim,
    handleApproveClaim,
    handleRejectClaim,
    handleUpdateUser,
    handleDeleteUser,
  } = useCampusMutations({ user, items, users, claims, showToast });

  const handleReportClick = (type: "lost" | "found") => {
    if (!user) {
      setLoginRole("student");
      setCurrentPage("login-form");
      return;
    }
    setShowReportForm(type);
  };

  const handleImageSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage("search");
    window.scrollTo(0, 0);
  };

  const handleReportSubmitAndClose = async (data: Record<string, unknown>) => {
    const ok = await handleReportSubmit(data);
    if (ok) setShowReportForm(null);
    return ok;
  };

  const filteredItems = filterItems(items, searchQuery, selectedCategory, selectedStatus);

  const showFooter = currentPage !== "dashboard" && currentPage !== "admin";

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onNotificationClick={handleNotificationClick}
      />

      {isOffline && <OfflineBanner />}

      <main>
        <AnimatePresence mode="wait">
          {currentPage === "home" && (
            <Hero
              onReportLost={() => handleReportClick("lost")}
              onReportFound={() => handleReportClick("found")}
              onSearch={() => handleNavigate("search")}
              onOpenImageSearch={() => setIsImageSearchOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {currentPage === "login-form" && (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onBack={() => handleNavigate("home")}
              onSignup={() => handleNavigate("signup")}
              initialRole={loginRole}
            />
          )}

          {currentPage === "signup" && (
            <SignupForm
              onSuccess={() => {
                handleNavigate("login-form");
                showToast("Registration successful! Please sign in.", "success");
              }}
              onBack={() => handleNavigate("home")}
              onLogin={() => handleNavigate("login-form")}
            />
          )}

          {currentPage === "dashboard" && user && user.role === "student" && (
            <Dashboard
              user={user}
              items={items}
              users={users}
              claims={claims}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              onLogout={handleLogout}
              onReportLost={() => handleReportClick("lost")}
              onReportFound={() => handleReportClick("found")}
              onViewItem={setSelectedItem}
              setIsImageSearchOpen={setIsImageSearchOpen}
            />
          )}

          {currentPage === "admin" && user && user.role === "admin" && (
            <AdminDashboard
              user={user}
              items={items}
              users={users}
              claims={claims}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAllNotifications={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              onLogout={handleLogout}
              onUpdateItem={handleUpdateItem}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              onViewItem={setSelectedItem}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              initialTab={adminTab}
            />
          )}

          {currentPage === 'not-found' && (
            <NotFound
              onBack={() => {
                setCurrentPage('home');
                window.history.replaceState(null, '', '/');
              }}
            />
          )}

          {currentPage === "search" && (
            <SearchPage
              items={items}
              users={users}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              filteredItems={filteredItems}
              onViewItem={setSelectedItem}
            />
          )}

          {currentPage === "report" && (
            <ReportPage
              onReportLost={() => handleReportClick("lost")}
              onReportFound={() => handleReportClick("found")}
            />
          )}
        </AnimatePresence>
      </main>

      {showFooter && (
        <AppFooter
          onNavigate={handleNavigate}
          onReportLost={() => handleReportClick("lost")}
          onReportFound={() => handleReportClick("found")}
          onAdminLogin={() => {
            setLoginRole(null);
            handleNavigate("login-form");
          }}
        />
      )}

      <AnimatePresence>
        {showReportForm && user && (
          <ReportForm
            type={showReportForm}
            user={user}
            onClose={() => setShowReportForm(null)}
            onSubmit={handleReportSubmitAndClose}
          />
        )}
      </AnimatePresence>

      <ItemDetailsModal
        item={selectedItem}
        reporter={selectedItem ? users.find((u) => u.id === selectedItem.reporterId) ?? null : null}
        currentUser={user}
        comments={comments.filter((c) => c.itemId === selectedItem?.id)}
        onClose={() => setSelectedItem(null)}
        onClaim={handleClaim}
        onUpdateItem={handleUpdateItem}
        onPostComment={handlePostComment}
        onDeleteComment={handleDeleteComment}
        onUpdateComment={handleUpdateComment}
        onLoginRedirect={() => {
          setSelectedItem(null);
          setLoginRole("student");
          setCurrentPage("login-form");
          window.scrollTo(0, 0);
        }}
      />

      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSearch={handleImageSearch}
      />

      <ChatbotWidget user={user} onNavigate={handleNavigate} />

      <ToastBanner toast={toast} />
    </div>
  );
}

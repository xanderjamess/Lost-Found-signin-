import { useEffect, useState } from "react";

export function useFirestoreOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOfflineStatus = (e: Event) => {
      const detail = (e as CustomEvent<{ offline: boolean }>).detail;
      setIsOffline(detail.offline);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("firestore-offline-status", handleOfflineStatus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof window !== "undefined" && (window as Window & { __firestore_offline__?: boolean }).__firestore_offline__) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("firestore-offline-status", handleOfflineStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

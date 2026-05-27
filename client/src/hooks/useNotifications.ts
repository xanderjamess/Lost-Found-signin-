import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType, setFirestoreOnline } from "../lib/firestoreUtils";
import { isUserAdmin } from "../lib/admin";
import type { Item, Notification, User } from "../types";

interface NotificationNavigation {
  setCurrentPage: (page: string) => void;
  setAdminTab: (tab: string) => void;
  setSelectedItem: (item: Item | null) => void;
  items: Item[];
}

export function useNotifications(user: User | null, nav: NotificationNavigation) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const qNotifs = query(collection(db, "notifications"), where("userId", "==", user.id));
    const unsubscribe = onSnapshot(
      qNotifs,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Notification)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(list);
        if (!snapshot.metadata.fromCache) setFirestoreOnline();
      },
      (error) => handleFirestoreError(error, OperationType.GET, "notifications", false)
    );

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  }, []);

  const handleClearAllNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", user.id));
      const snapshot = await getDocs(q);
      await Promise.all(
        snapshot.docs.map((d) =>
          deleteDoc(d.ref).catch((e) => handleFirestoreError(e, OperationType.DELETE, d.ref.path))
        )
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('{"error"')) throw error;
      handleFirestoreError(error, OperationType.LIST, "notifications");
    }
  }, [user]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!user) return;

      const { setCurrentPage, setAdminTab, setSelectedItem, items } = nav;

      if (isUserAdmin(user)) {
        setCurrentPage("admin");
        const msg = notification.message.toLowerCase();
        if (msg.includes("pending")) setAdminTab("pending-reports");
        else if (msg.includes("claim")) setAdminTab("claims");
        else if (msg.includes("match")) setAdminTab("overview");
      } else {
        if (notification.type === "match") {
          setCurrentPage("search");
          if (notification.itemId) {
            const item = items.find((i) => i.id === notification.itemId);
            if (item) setSelectedItem(item);
          }
        } else if (notification.itemId) {
          const item = items.find((i) => i.id === notification.itemId);
          if (item) setSelectedItem(item);
        }
      }

      handleMarkAsRead(notification.id);
    },
    [user, nav, handleMarkAsRead]
  );

  return {
    notifications,
    handleMarkAsRead,
    handleClearAllNotifications,
    handleNotificationClick,
  };
}

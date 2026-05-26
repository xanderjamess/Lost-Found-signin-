import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType, setFirestoreOnline } from "../lib/firestoreUtils";
import type { Claim, Comment, Item, User } from "../types";

export function useFirestoreData(user: User | null, authLoading: boolean) {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) {
        setItems([]);
        setUsers([]);
        setClaims([]);
        setComments([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    const qItems = query(collection(db, "items"), orderBy("date", "desc"));
    const unsubscribeItems = onSnapshot(
      qItems,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Item));
        setLoading(false);
        if (!snapshot.metadata.fromCache) setFirestoreOnline();
      },
      (error) => handleFirestoreError(error, OperationType.GET, "items", false)
    );

    const qUsers = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as User));
        if (!snapshot.metadata.fromCache) setFirestoreOnline();
      },
      (error) => handleFirestoreError(error, OperationType.GET, "users", false)
    );

    const qClaims =
      user.role === "admin"
        ? query(collection(db, "claims"), orderBy("date", "desc"))
        : query(collection(db, "claims"), where("userId", "==", user.id));

    const unsubscribeClaims = onSnapshot(
      qClaims,
      (snapshot) => {
        let claimsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Claim);
        if (user.role !== "admin") {
          claimsList = claimsList.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }
        setClaims(claimsList);
        if (!snapshot.metadata.fromCache) setFirestoreOnline();
      },
      (error) => handleFirestoreError(error, OperationType.GET, "claims", false)
    );

    const qComments = query(collection(db, "comments"), orderBy("date", "desc"));
    const unsubscribeComments = onSnapshot(
      qComments,
      (snapshot) => {
        setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment));
        if (!snapshot.metadata.fromCache) setFirestoreOnline();
      },
      (error) => handleFirestoreError(error, OperationType.GET, "comments", false)
    );

    return () => {
      unsubscribeItems();
      unsubscribeUsers();
      unsubscribeClaims();
      unsubscribeComments();
    };
  }, [user, authLoading]);

  return { items, users, claims, comments, loading };
}

import { useCallback } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import type { Claim, Comment, Item, User } from "../types";
import type { ToastType } from "./useToast";

interface CampusMutationsOptions {
  user: User | null;
  items: Item[];
  users: User[];
  claims: Claim[];
  showToast: (message: string, type?: ToastType) => void;
}

export function useCampusMutations({ user, items, users, claims, showToast }: CampusMutationsOptions) {
  const handleUpdateItem = useCallback(
    async (id: string, updates: Partial<Item>) => {
      try {
        await updateDoc(doc(db, "items", id), updates);

        const oldItem = items.find((i) => i.id === id);
        if (oldItem?.status === "pending" && (updates.status === "lost" || updates.status === "found")) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: oldItem.reporterId,
              message: `Your report for "${oldItem.title}" has been approved!`,
              type: "status-update",
              date: new Date().toISOString(),
              read: false,
              itemId: id,
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, "notifications");
          }
        } else if (oldItem?.status === "pending" && updates.status === "declined") {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: oldItem.reporterId,
              message: `Your report for "${oldItem.title}" was declined.`,
              type: "status-update",
              date: new Date().toISOString(),
              read: false,
              itemId: id,
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, "notifications");
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
      }
    },
    [items]
  );

  const handleReportSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<boolean> => {
      if (!user) return false;

      try {
        const newItem: any = {
          ...data,
          reporterId: user.id,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        // Only include imageUrl if the reporter provided one. Do not auto-fill a placeholder image.
        if (data.imageUrl && (data.imageUrl as string).trim() !== '') {
          newItem.imageUrl = data.imageUrl as string;
        }

        const docRef = await addDoc(collection(db, "items"), newItem);

        const adminUsers = users.filter((u) => u.role === "admin");
        for (const admin of adminUsers) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: admin.id,
              message: `New pending ${data.type} report: "${data.title}" submitted by ${user.name}.`,
              type: "system",
              date: new Date().toISOString(),
              read: false,
              itemId: docRef.id,
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, "notifications");
          }
        }

        showToast("Your report has been submitted for approval.");
        return true;
      } catch (error) {
        if (error instanceof Error && error.message.includes('{"error"')) {
          const parsed = JSON.parse(error.message);
          showToast(`Database Error: ${parsed.error}`, "error");
        } else {
          console.error("Error submitting report:", error);
          showToast("Failed to submit report. Please try again.", "error");
        }
        return false;
      }
    },
    [user, users, showToast]
  );

  const handlePostComment = useCallback(
    async (itemId: string, content: string, parentId?: string) => {
      if (!user) return;
      try {
        await addDoc(collection(db, "comments"), {
          itemId,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          content,
          date: new Date().toISOString(),
          parentId: parentId || null,
          isDeleted: false,
          isFlagged: false,
          isHidden: false,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "comments");
      }
    },
    [user]
  );

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await updateDoc(doc(db, "comments", commentId), { isDeleted: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  }, []);

  const handleUpdateComment = useCallback(async (commentId: string, updates: Partial<Comment>) => {
    try {
      await updateDoc(doc(db, "comments", commentId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  }, []);

  const handleClaim = useCallback(
    async (itemId: string, message: string, proofImageUrl?: string) => {
      if (!user) return;

      try {
        const verificationId = `VER-${Math.random().toString(36).substr(2, 6)}`;
        await addDoc(collection(db, "claims"), {
          itemId,
          userId: user.id,
          status: "pending",
          date: new Date().toISOString(),
          message,
          proofImageUrl: proofImageUrl || null,
          verificationId,
        });

        await handleUpdateItem(itemId, { status: "under-review" });

        const item = items.find((i) => i.id === itemId);
        if (item) {
          try {
            await addDoc(collection(db, "notifications"), {
              userId: item.reporterId,
              message: `Someone has submitted a claim for your ${item.status} item: "${item.title}".`,
              type: "status-update",
              date: new Date().toISOString(),
              read: false,
              itemId,
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, "notifications");
          }

          for (const admin of users.filter((u) => u.role === "admin")) {
            try {
              await addDoc(collection(db, "notifications"), {
                userId: admin.id,
                message: `New claim submitted for item: "${item.title}" by ${user.name}.`,
                type: "system",
                date: new Date().toISOString(),
                read: false,
                itemId,
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.WRITE, "notifications");
            }
          }
        }

        showToast("Your claim has been submitted and is under review.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('{"error"')) {
          const parsed = JSON.parse(error.message);
          showToast(`Database Error: ${parsed.error}`, "error");
        } else {
          console.error("Error submitting claim:", error);
          showToast("Failed to submit claim.", "error");
        }
      }
    },
    [user, items, users, handleUpdateItem, showToast]
  );

  const handleApproveClaim = useCallback(
    async (claimId: string) => {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;

      try {
        await updateDoc(doc(db, "claims", claimId), { status: "approved" });
        await handleUpdateItem(claim.itemId, {
          status: "claimed",
          claimedAt: new Date().toISOString(),
          claimedBy: claim.userId,
          approvedBy: user?.id,
        });

        try {
          await addDoc(collection(db, "notifications"), {
            userId: claim.userId,
            message: `Your claim for item #${claim.itemId.slice(-6)} has been approved!`,
            type: "status-update",
            date: new Date().toISOString(),
            read: false,
            itemId: claim.itemId,
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, "notifications");
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `claims/${claimId}`);
      }
    },
    [claims, user, handleUpdateItem]
  );

  const handleRejectClaim = useCallback(
    async (claimId: string) => {
      const claim = claims.find((c) => c.id === claimId);
      if (!claim) return;

      try {
        await updateDoc(doc(db, "claims", claimId), { status: "rejected" });
        await handleUpdateItem(claim.itemId, { status: "found" });

        try {
          await addDoc(collection(db, "notifications"), {
            userId: claim.userId,
            message: `Your claim for item #${claim.itemId.slice(-6)} was declined.`,
            type: "status-update",
            date: new Date().toISOString(),
            read: false,
            itemId: claim.itemId,
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, "notifications");
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `claims/${claimId}`);
      }
    },
    [claims, handleUpdateItem]
  );

  const handleUpdateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  }, []);

  const handleDeleteUser = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  }, []);

  return {
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
  };
}

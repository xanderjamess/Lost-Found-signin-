import type { User } from "../types";

const ADMIN_EMAILS = new Set([
  "xanderjamesmata951@gmail.com",
  "admin@gmail.com",
]);

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || ADMIN_EMAILS.has(user.email);
}

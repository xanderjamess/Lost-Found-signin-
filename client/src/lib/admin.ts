import type { User } from "../types";

const ADMIN_EMAILS = new Set([
  "xanderjamesmata951@gmail.com",
  "admin@gmail.com",
  "8648964@proton.me",
  "2023-9938-68182@bicol-u.edu.ph",
]);

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === "admin" || ADMIN_EMAILS.has(user.email);
}

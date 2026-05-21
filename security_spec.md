# Firebase Security Specification

## Data Invariants
1. **Users**:
    - Users can only read their own sensitive profile data. Public parts (name, role, avatar) might be readable by others if needed for comments/reports.
    - Users cannot change their own `role`.
    - `schoolEmail` must end with `.edu.ph`.
2. **Items**:
    - Anyone signed in can read items (to search for lost things).
    - People can only update reports they created, or admins can update any.
    - `reporterId` must match the authenticated user during creation.
3. **Claims**:
    - Claims can only be created by signed-in users.
    - `userId` must match the authenticated user.
    - Only admins can approve or reject claims.
    - Users can only read their own claims.
4. **Comments**:
    - Anyone signed in can read comments.
    - Users can only delete or edit their own comments.
    - `userId` must match the authenticated user.
5. **Notifications**:
    - Users can only read and update (mark as read) their own notifications.

## The Dirty Dozen Payloads (Identity, Integrity, State)

1. **Self-Promotion**: User tries to create account with `role: "admin"`.
2. **Identity Spoofing**: User tries to create a report with a different `reporterId`.
3. **Orphaned Writes**: Creating a claim for a non-existent item.
4. **Unauthorized Update**: Student trying to approve their own claim (`status: "approved"`).
5. **PII Leak**: Student trying to read another student's full profile (including email, student ID).
6. **Shadow Field**: Adding `isVerified: true` to a user profile update.
7. **Cross-User Delete**: User A trying to delete User B's comment.
8. **Resource Poisoning**: Extremely long string in item description (Denial of Wallet).
9. **Fake Verification**: User A trying to update another user's notification as read.
10. **State Shortcut**: Updating an item from `pending` to `claimed` directly without approval.
11. **Malicious ID**: Creating a document with a 2KB ID string.
12. **Bypassing Verification**: Creating a report with a fake `schoolEmail` not ending in `.edu.ph`.

## Verification Plan
We will use `DRAFT_firestore.rules` and run ESLint.
The final rules will be written to `firestore.rules`.

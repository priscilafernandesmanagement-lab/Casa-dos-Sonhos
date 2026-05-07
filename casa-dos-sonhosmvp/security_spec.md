# Security Specification for Casa dos Sonhos

## Data Invariants
1. A `User` document metadata (createdAt, email) can only be set once.
2. A `Construction` must be owned by the user who created it (`ownerId == request.auth.uid`).
3. Only the owner of a `Construction` can read or write its `WorkDetail` sub-collection.
4. `User` profiles (pii) are private to the owner.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Creating a construction with another user's `ownerId`.
2. **PII Leak**: Reading another user's profile.
3. **Ghost Fields**: Adding `isAdmin: true` to a user profile or construction.
4. **Outcome Shortcut**: Updating a construction status to `completed` without proper authorization or as a non-owner.
5. **Orphaned Writes**: Creating a `WorkDetail` for a non-existent `Construction`.
6. **Immutable Tampering**: Changing `createdAt` or `ownerId` on a construction.
7. **Resource Poisoning**: Using a 1MB string for a construction title.
8. **Unauthorized Update**: A non-owner attempting to change the budget of a construction.
9. **Verification Bypass**: Writing data while the email is not verified (if mandated).
10. **Shadow List**: Listing all constructions without being the owner of them.
11. **ID Exhaustion**: Using a junk-string as a document ID.
12. **Timestamp Fraud**: Providing a past or future client-side timestamp instead of `request.time`.

## Test Plan
- Verify that every "Dirty Dozen" payload returns `PERMISSION_DENIED`.
- Verify that owners can manage their own constructions.
- Verify that sub-collection access is tied to parent ownership.

# Concurrent Profile Writes — Conflict Policy

## 1. Purpose
Prevent concurrent profile updates from silently overwriting each other.

## 2. Conflict-Resolution Strategy
Use **optimistic concurrency control** with a version number for each profile. Clients submit the version they last received.

## 3. Update Procedure
1. Client fetches the profile and its version.
2. Client submits changes with that version.
3. Backend checks the version and updates the profile atomically.
4. On success, the version increments.
5. If the version is outdated, return `409 Conflict`.

## 4. Conflict Policy
- Current version: accept the update and increment the version.
- Outdated version: reject with `409 Conflict`.
- Two concurrent updates with the same version: only one succeeds.
- Missing or invalid version: reject through request validation.

## 5. Example Scenario
Two requests use version `5`. The first update succeeds, changing the version to `6`. The second receives `409 Conflict` because its version is outdated.

## 6. Client Behavior After a Conflict
Fetch the latest profile, reconcile the changes, and resubmit only if appropriate using the latest version.

## 7. Implementation Requirements
- Store a version number for each profile.
- Check the expected version during the database update.
- Increment the version atomically.
- Return `409 Conflict` when the version no longer matches.

## 8. Verification
Test successful updates, version increments, stale updates, simultaneous requests, and missing or invalid versions.

## 9. Summary
Optimistic concurrency control prevents stale profile updates from overwriting newer changes. Conflicting updates are rejected with `409 Conflict`.

**Implementation status:** This describes the intended policy; verify the backend implementation before marking the requirement complete.
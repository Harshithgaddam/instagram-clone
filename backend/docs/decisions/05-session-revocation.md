**Decision:** The app records revocation by setting revoked_at on a session. Sign-out revokes only the current session. When a session check finds that its account is disabled, the app revokes that account's sessions.

**Options:** Delete session records; keep records and set a revocation time; revoke every session whenever a member signs out.

**Why this one:** Keeping the record and its revocation time preserves a history of the session. Revoking only the current session lets the member stay signed in on their other devices.

**Risks:** Disabling an account does not revoke its sessions immediately; revocation happens when a request next checks one. Tests should confirm that revoked sessions are rejected.

**Test proving it:** Automated tests for sign-out revocation and disabled-account sessions are still needed in [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts).

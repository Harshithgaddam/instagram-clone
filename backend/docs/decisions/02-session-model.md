**Decision:** After sign-in, the server creates a random session token and stores its SHA-256 hash in PostgreSQL. The raw token is sent to the browser in a cookie.

**Options:** PostgreSQL-backed sessions; sessions kept only in server memory; signed JWTs that the server validates without a session lookup.

**Why this one:** PostgreSQL is already part of the app. Database-backed sessions survive server restarts and can be revoked by updating their records. Hashing the token means a database leak does not directly reveal usable session tokens.

**Risks:** Protected requests depend on PostgreSQL being available and responsive. If the database is unavailable, the app cannot validate sessions; each protected request also needs a database lookup.

**Test proving it:** [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts) signs in and uses the session cookie to access a protected route. Tests for session persistence after restart and for storing only the token hash are still needed.

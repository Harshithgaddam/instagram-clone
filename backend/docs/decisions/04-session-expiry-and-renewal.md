**Decision:** A session expires seven days after sign-in. Before it expires, a member can call the authenticated POST /auth/refresh route to extend that session by seven days.

**Options:** Use a fixed seven-day expiry with no renewal; extend the session on every request; renew only when the refresh route is called.

**Why this one:** Explicit refresh avoids a database write on every request and extends only the session presented by the member.

**Risks:** The frontend does not call the refresh route yet. If the session expires before refresh, the member must sign in again.

**Test proving it:** Automated tests for successful refresh, updated expiry, and rejection of expired sessions are still needed in [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts).

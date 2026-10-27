**Decision:** Apply IP-based rate limits: 10 POST /auth/login requests per 15 minutes and 5 POST /auth/register requests per hour. Requests over the limit receive HTTP 429.

**Options:** No rate limit; limit requests by IP address; add CAPTCHA checks.

**Why this one:**  IP limits add a basic barrier to repeated automated attempts without requiring a CAPTCHA on every request.

**Risks:** People sharing an IP address also share its limit. The default in-memory counter is separate on each server instance, and proxy settings must be correct for Express to use the real client IP.

**Test proving it:** Automated tests that exceed each limit and receive 429 are still needed in [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts). Concurrent duplicate registration was tested manually, not by an automated test.

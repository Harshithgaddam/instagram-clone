**Decision:** The server sends the session token to the browser in an HttpOnly cookie. The browser saves the cookie and sends it with requests to the API. In production, the cookie also uses Secure, so the browser sends it only over HTTPS.

**Options:** Put the token in an HttpOnly cookie; send it in the Authorization header as a bearer token; or save it somewhere JavaScript can read.

**Why this one:** The browser adds the cookie to matching requests automatically. HttpOnly stops page JavaScript from reading the session token. This reduces the chance that a script running on the page can steal it.

**Risks:** A browser may send cookies automatically, so another site could try to make a request as the signed-in user. The app needs CSRF protection and correct SameSite and CORS settings, especially if the frontend and API are on different sites.

**Test proving it:** [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts) signs in, then uses the returned cookie to access a protected route. Automated tests still need to check the cookie settings and requests from a different site.

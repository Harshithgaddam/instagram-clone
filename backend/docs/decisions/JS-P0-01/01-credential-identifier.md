**Decision:** Members register and sign in with a normalized handle and password. Passwords are hashed with Argon2id before they are stored.

**Options:** Email and password; handle and password; passwordless sign-in.

**Why this one:** Handles are already the app's public account identifier, so registration does not need an email address. Argon2id is designed for passwords and makes a stolen password hash harder to crack than a fast hash.

**Risks:** Members may choose weak or reused passwords. Input limits and generic login errors help, but password-strength guidance and account recovery are not implemented yet.

**Test proving it:** [a3.e2e-spec.ts](../../test/a3.e2e-spec.ts) checks registration validation and registers and signs in a test account. An automated check that the stored value is an Argon2id hash is still needed.

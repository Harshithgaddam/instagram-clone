import { useState } from "react";
import "./AuthPage.css";

function AuthPage({ onLogin, onRegister, loading, error }) {
  const [mode, setMode] = useState("login");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const isRegistering = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    const credentials = {
      handle,
      password,
      ...(isRegistering ? { displayName } : {}),
    };

    if (isRegistering) {
      await onRegister(credentials);
    } else {
      await onLogin(credentials);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Instagram</h1>
        <p className="auth-subtitle">
          {isRegistering
            ? "Create an account to see your feed."
            : "Log in to continue to your feed."}
        </p>

        <form onSubmit={submit} className="auth-form">
          {isRegistering && (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                required
                maxLength={50}
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Handle
            <input
              value={handle}
              onChange={(event) =>
                setHandle(event.target.value)
              }
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]+"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                isRegistering ? "new-password" : "current-password"
              }
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegistering
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(isRegistering ? "login" : "register");
          }}
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "New to Instagram? Create an account"}
        </button>
      </section>
    </main>
  );
}

export default AuthPage;

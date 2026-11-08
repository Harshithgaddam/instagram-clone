const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ??
      body?.error?.message ??
      "Request failed.";
    const error = new Error(
      Array.isArray(message) ? message.join(", ") : message,
    );
    error.status = response.status;
    throw error;
  }

  return body;
};

export const login = ({ handle, password }) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ handle, password }),
  });

export const register = ({
  handle,
  displayName,
  password,
}) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      handle,
      displayName,
      password,
    }),
  });

export const logout = () =>
  request("/auth/logout", {
    method: "POST",
  });

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

// A single login attempt against Account Shield
export async function attemptLogin(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getLoginAttempts(token) {
  const res = await fetch(`${API_BASE}/api/analyst/login-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load login activity");
  return res.json();
}
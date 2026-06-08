const API_BASE = "http://localhost:8080";

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  return res.json(); // { token, role, email }
}

export async function getAlerts(token) {
  const res = await fetch(`${API_BASE}/api/analyst/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export async function explainAlert(token, alertId) {
  const res = await fetch(`${API_BASE}/api/analyst/alerts/${alertId}/explain`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to explain alert");
  return res.json(); // { alertId, explanation }
}

export async function getLoginAttempts(token) {
  const res = await fetch(`${API_BASE}/api/analyst/login-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load login activity");
  return res.json();
}
export async function getTenants(token) {
  const res = await fetch(`${API_BASE}/api/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load tenants");
  return res.json();
}

export async function createTenant(token, name) {
  const res = await fetch(`${API_BASE}/api/platform-admin/tenants`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create tenant");
  return res.json();
}

export async function createTenantAdmin(token, { email, password, tenantId }) {
  const res = await fetch(`${API_BASE}/api/platform-admin/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "TENANT_ADMIN", tenantId: Number(tenantId) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create admin");
  }
  return res.json();
}

export async function resetBlocks(token) {
  const res = await fetch(`${API_BASE}/api/platform-admin/reset-blocks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reset blocks");
  return res.json();
}
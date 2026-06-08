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

export async function getMyMembers(token) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load members");
  return res.json();
}

export async function addMember(token, { email, password, role }) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: role || "MEMBER" }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed to add member"); }
  return res.json();
}

export async function updateMember(token, id, fields) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update member");
  return res.json();
}

export async function deleteMember(token, id) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete member");
  return res.json();
}

export async function getMemberLoginAttempts(token, id) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users/${id}/login-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load member activity");
  return res.json();
}

export async function resetMemberBlock(token, id) {
  const res = await fetch(`${API_BASE}/api/tenant-admin/users/${id}/reset-block`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reset block");
  return res.json();

}
export async function resolveAlert(token, id) {
  const res = await fetch(`${API_BASE}/api/analyst/alerts/${id}/resolve`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to resolve");
  return res.json();
}

export async function blockForeverAlert(token, id) {
  const res = await fetch(`${API_BASE}/api/analyst/alerts/${id}/block-forever`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to block");
  return res.json();
}

export async function releaseBlockAlert(token, id) {
  const res = await fetch(`${API_BASE}/api/analyst/alerts/${id}/release-block`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to release block");
  return res.json();
}

export async function submitEnquiry({ companyName, contactEmail, message }) {
  const res = await fetch(`${API_BASE}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, contactEmail, message }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed to submit"); }
  return res.json();
}
export async function getEnquiries(token) {
  const res = await fetch(`${API_BASE}/api/platform-admin/enquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load enquiries");
  return res.json();
}

export async function approveEnquiry(token, id) {
  const res = await fetch(`${API_BASE}/api/platform-admin/enquiries/${id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed to approve"); }
  return res.json();
}
export async function deleteUser(token, userId) {
  const res = await fetch(`${API_BASE}/api/platform-admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function getTenantUsers(token, tenantId) {
  const res = await fetch(`${API_BASE}/api/platform-admin/tenants/${tenantId}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load tenant users");
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

export async function deleteTenant(token, tenantId) {
  const res = await fetch(`${API_BASE}/api/platform-admin/tenants/${tenantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete tenant");
  return res.json();
}

export async function getTenantAlerts(token, tenantId) {
  const res = await fetch(`${API_BASE}/api/platform-admin/tenants/${tenantId}/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load tenant alerts");
  return res.json();
}

export async function getTenantLoginAttempts(token, tenantId) {
  const res = await fetch(`${API_BASE}/api/platform-admin/tenants/${tenantId}/login-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load tenant login activity");
  return res.json();
}
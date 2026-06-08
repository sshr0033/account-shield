import { useState } from "react";
import { attemptLogin } from "./api";

export default function App() {
  const [email, setEmail] = useState("member@demo.test");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [blocked, setBlocked] = useState(false);

  function addLog(line, type = "info") {
    setLog((prev) => [{ line, type, t: new Date().toLocaleTimeString() }, ...prev].slice(0, 60));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage(null);
    const result = await attemptLogin(email, password);
    if (result.status === 429) {
      setBlocked(true);
      addLog(`Login blocked — ${email}`, "attack");
      return;
    }
    if (result.ok) {
      setMessage({ type: "ok", text: "Welcome back! You're securely logged in." });
      addLog(`Successful login — ${email}`, "ok");
    } else {
      setMessage({ type: "err", text: result.data.error || "Invalid credentials." });
      addLog(`Failed login — ${email}`, "err");
    }
  }

async function bruteForce() {
    setRunning(true);
    addLog("Launching brute-force attack on member@demo.test", "attack");
    for (let i = 1; i <= 8; i++) {
      const result = await attemptLogin("member@demo.test", "wrongpass" + i);
      if (result.status === 429) {
        addLog(`  attempt ${i} — BLOCKED by Account Shield`, "attack");
        setBlocked(true);
      } else {
        addLog(`  attempt ${i} — failed login`, "err");
      }
    }
    addLog("Account Shield blocked the attack after 5 attempts ", "attack");
    setRunning(false);
  }
async function credentialStuffing() {
    setRunning(true);
    addLog("Launching credential-stuffing attack (stolen email list)", "attack");
    for (let i = 1; i <= 14; i++) {
      const result = await attemptLogin(`victim${i}@stolen-list.com`, "Password123");
      if (result.status === 429) {
        addLog(`  victim${i}@stolen-list.com — BLOCKED by Account Shield`, "attack");
        setBlocked(true);
      } else {
        addLog(`  trying victim${i}@stolen-list.com — failed`, "err");
      }
    }
    addLog("Burst complete → open Account Shield to see the alert", "attack");
    setRunning(false);
  }

  return (
    <div style={s.page}>
      {/* top bar */}
      <div style={s.topbar}>
        <div style={s.topbarBrand}>
          <span style={s.logoMark}>◆</span> Future Super
        </div>
        <div style={s.topbarLinks}>
          <span style={s.topLink}>Investments</span>
          <span style={s.topLink}>Insurance</span>
          <span style={s.topLink}>Advice</span>
          <span style={{ ...s.topLink, ...s.topLinkActive }}>Member Login</span>
        </div>
      </div>

      <div style={s.body}>
        {/* Left: hero + login */}
        <div style={s.left}>
          <h1 style={s.heroTitle}>Your super, secured.</h1>
          <p style={s.heroText}>
            Future Super protects your retirement savings with bank-grade
            security, powered by <strong>Account Shield</strong> fraud detection.
          </p>

          <div style={s.loginCard}>
            <div style={s.loginHeading}>Member Login</div>
            <form onSubmit={handleLogin}>
              <label style={s.label}>Email address</label>
              <input style={s.input} value={email} onChange={(e) => setEmail(e.target.value)} />
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button style={s.loginBtn} type="submit">Log in securely</button>
            </form>
            {message && (
              <div style={{ ...s.msg, ...(message.type === "ok" ? s.msgOk : s.msgErr) }}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* Right: demo panel + live log */}
        <div style={s.right}>
          <div style={s.demoCard}>
            <div style={s.demoBadge}>DEMO CONTROL</div>
            <div style={s.demoTitle}>Simulate an attack</div>
            <p style={s.demoText}>
              These buttons fire login traffic at the live Account Shield API,
              just like a real attacker would. Watch the alerts appear in the
              Account Shield analyst dashboard.
            </p>
            <button style={s.attackBtn} onClick={bruteForce} disabled={running}>
              {running ? "Running…" : "Brute-force one account"}
            </button>
            <button style={{ ...s.attackBtn, marginTop: 10 }} onClick={credentialStuffing} disabled={running}>
              {running ? "Running…" : "Credential-stuffing (many accounts)"}
            </button>
          </div>

          <div style={s.console}>
            <div style={s.consoleTitle}>● Live Activity</div>
            {log.length === 0 && <div style={s.logEmpty}>Waiting for activity…</div>}
            {log.map((entry, i) => (
              <div key={i} style={s.logLine}>
                <span style={s.logTime}>{entry.t}</span>
                <span style={{ color: logColor(entry.type) }}>{entry.line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {blocked && (
        <div style={s.overlay} onClick={() => setBlocked(false)}>
          <div style={s.dialog} onClick={(e) => e.stopPropagation()}>
            <div style={s.dialogIcon}>🛡️</div>
            <div style={s.dialogTitle}>Access Temporarily Blocked</div>
            <div style={s.dialogText}>
              Account Shield has detected too many failed login attempts from your
              location and has temporarily blocked further attempts to protect this account.
            </div>
            <button style={s.dialogBtn} onClick={() => setBlocked(false)}>
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const logColor = (t) =>
  t === "ok" ? "#34d399" : t === "attack" ? "#f87171" : t === "err" ? "#fbbf24" : "#94a3b8";

const s = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  topbar: { background: "white", padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  topbarBrand: { fontSize: 22, fontWeight: 800, color: "#0f766e", display: "flex", alignItems: "center", gap: 8 },
  logoMark: { color: "#14b8a6" },
  topbarLinks: { display: "flex", gap: 28 },
  topLink: { color: "#64748b", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  topLinkActive: { color: "#0f766e", fontWeight: 700 },
  body: { display: "flex", gap: 40, padding: "56px 64px", alignItems: "flex-start", flexWrap: "wrap" },
  left: { flex: 1, minWidth: 360 },
  heroTitle: { fontSize: 42, fontWeight: 800, color: "#0f172a", margin: "0 0 16px", lineHeight: 1.1 },
  heroText: { fontSize: 17, color: "#475569", lineHeight: 1.6, marginBottom: 36, maxWidth: 460 },
  loginCard: { background: "white", borderRadius: 16, padding: 32, maxWidth: 420, boxShadow: "0 10px 40px rgba(15,23,42,0.08)" },
  loginHeading: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 },
  label: { display: "block", fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", marginBottom: 16, fontSize: 14 },
  loginBtn: { width: "100%", background: "#0f766e", color: "white", border: "none", padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  msg: { marginTop: 16, padding: "11px 14px", borderRadius: 10, fontSize: 14 },
  msgOk: { background: "#dcfce7", color: "#166534" },
  msgErr: { background: "#fee2e2", color: "#991b1b" },
  right: { width: 380 },
  demoCard: { background: "#0f172a", borderRadius: 16, padding: 28, marginBottom: 20 },
  demoBadge: { display: "inline-block", background: "#7f1d1d", color: "#fca5a5", fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", borderRadius: 6, marginBottom: 14 },
  demoTitle: { color: "white", fontSize: 20, fontWeight: 700, marginBottom: 8 },
  demoText: { color: "#94a3b8", fontSize: 13, lineHeight: 1.6, marginBottom: 20 },
  attackBtn: { width: "100%", background: "#dc2626", color: "white", border: "none", padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  console: { background: "#0b0f17", borderRadius: 16, padding: 22, minHeight: 280, fontFamily: "ui-monospace, monospace", border: "1px solid #1e293b" },
  consoleTitle: { color: "#34d399", fontSize: 12, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" },
  logEmpty: { color: "#475569", fontSize: 13 },
  logLine: { fontSize: 12, marginBottom: 5, lineHeight: 1.5, display: "flex", gap: 10 },
  logTime: { color: "#475569", flexShrink: 0 },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  dialog: { background: "white", borderRadius: 16, padding: 36, width: 400, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  dialogIcon: { fontSize: 44, marginBottom: 12 },
  dialogTitle: { fontSize: 20, fontWeight: 800, color: "#dc2626", marginBottom: 12 },
  dialogText: { fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 24 },
  dialogBtn: { background: "#0f766e", color: "white", border: "none", padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
import { Router } from "express";
import { db } from "./bot/db/database";

const router = Router();

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh}
.header{background:#161b22;border-bottom:1px solid #30363d;padding:1rem 2rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}
.logo{font-size:1.3rem;font-weight:700;color:#5865f2}.nav-links{display:flex;gap:.75rem;margin-left:auto;flex-wrap:wrap}
.nav-links a{color:#58a6ff;text-decoration:none;font-size:.85rem;padding:.3rem .75rem;background:#21262d;border-radius:4px}
.nav-links a:hover{background:#30363d}.main{padding:2rem;max-width:1300px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-top:1.5rem}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1.5rem;transition:border-color .2s}
.card:hover{border-color:#5865f2}.card h3{font-size:1rem;margin-bottom:.5rem;color:#5865f2}
.card a{color:#58a6ff;text-decoration:none;font-family:monospace;font-size:.85rem;word-break:break-all}
.card a:hover{text-decoration:underline}
.stats-row{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1.25rem}
.stat-box{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1rem 1.5rem;flex:1;min-width:120px;text-align:center}
.stat-box .num{font-size:1.75rem;font-weight:700;color:#5865f2}.stat-box .lbl{font-size:.8rem;color:#8b949e;margin-top:.25rem}
table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.875rem}
th{background:#161b22;color:#8b949e;font-weight:600;padding:.75rem 1rem;text-align:left;border-bottom:2px solid #30363d}
td{padding:.65rem 1rem;border-bottom:1px solid #21262d;vertical-align:top}tr:hover td{background:#161b22}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600;color:#fff}
.nav{display:flex;gap:.5rem;margin-top:1rem;align-items:center}
.nav a{color:#58a6ff;text-decoration:none;padding:.4rem .8rem;background:#21262d;border-radius:4px;font-size:.85rem}
.nav a:hover{background:#30363d}.nav span{color:#8b949e;font-size:.85rem}
h2{color:#e6edf3;margin-bottom:.25rem}h3{color:#e6edf3;margin-bottom:.5rem;margin-top:1.25rem}
.search-bar{display:flex;gap:.75rem;margin-top:1rem}
.search-bar input{flex:1;background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:.5rem 1rem;border-radius:6px;font-size:.9rem}
.search-bar input:focus{outline:none;border-color:#5865f2}
.search-bar button{background:#5865f2;color:#fff;border:none;padding:.5rem 1.25rem;border-radius:6px;cursor:pointer;font-size:.9rem}
.search-bar button:hover{background:#4752c4}
p.muted{color:#8b949e;margin-top:.5rem}`;

function authCheck(req: import("express").Request, res: import("express").Response): string | null {
  const token = process.env.DASHBOARD_TOKEN;
  if (!token) return "";
  const provided = (req.query.token as string | undefined) ?? req.headers.authorization?.replace("Bearer ", "");
  if (provided !== token) {
    res.status(401).send(`<html><body style="font-family:monospace;padding:2rem;background:#1a1a2e;color:#e0e0e0">
      <h2 style="color:#ff4444">401 Unauthorized</h2>
      <p>Provide <code>?token=YOUR_DASHBOARD_TOKEN</code> in the URL.</p></body></html>`);
    return null;
  }
  return provided ?? "";
}

function tokenParam(token: string): string {
  return token ? `?token=${encodeURIComponent(token)}` : "";
}

function qs(token: string, extra: Record<string, string | number> = {}): string {
  const p = new URLSearchParams();
  if (token) p.set("token", token);
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

const ACTION_COLORS: Record<string, string> = {
  BAN: "#ff4444", KICK: "#ff8800", MUTE: "#ffaa00", WARN: "#ffdd00",
  TEMPBAN: "#ff6622", UNBAN: "#44ff88", UNMUTE: "#44ffaa", NOTE: "#8888ff", DELETE: "#ff4444",
};

function header(token: string, guildId?: string): string {
  const tp = tokenParam(token);
  return `<div class="header">
  <div class="logo">🛡️ DIFF Meets Mod</div>
  <div class="nav-links">
    <a href="/dashboard${tp}">All Guilds</a>
    ${guildId ? `
    <a href="/dashboard/guild/${guildId}${tp}">Cases</a>
    <a href="/dashboard/guild/${guildId}/warnings${tp}">Warnings</a>
    <a href="/dashboard/guild/${guildId}/tickets${tp}">Tickets</a>
    <a href="/dashboard/guild/${guildId}/search${tp}">Search User</a>` : ""}
  </div>
</div>`;
}

function pageWrap(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — DIFF Meets Mod</title>
<style>${CSS}</style></head><body>${body}</body></html>`;
}

// ── Home ─────────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const token = authCheck(req, res);
  if (token === null) return;
  const guilds = db.prepare("SELECT guild_id FROM guild_config").all() as unknown as { guild_id: string }[];
  const tp = tokenParam(token);
  res.send(pageWrap("Dashboard", `${header(token)}
<div class="main">
  <h2>Guilds (${guilds.length})</h2>
  <p class="muted">Click a guild to view its moderation data.</p>
  <div class="grid">${guilds.map(g => `<div class="card">
    <h3>Guild</h3>
    <div style="font-family:monospace;font-size:.85rem;color:#e6edf3;margin-bottom:.75rem">${g.guild_id}</div>
    <a href="/dashboard/guild/${g.guild_id}${tp}">View Dashboard →</a>
  </div>`).join("")}</div>
</div>`));
});

// ── Cases ─────────────────────────────────────────────────────────────────────
router.get("/guild/:guildId", (req, res) => {
  const token = authCheck(req, res);
  if (token === null) return;
  const { guildId } = req.params;
  const page = Math.max(0, parseInt((req.query.page as string | undefined) ?? "1") - 1);
  const PAGE = 20;

  const cases = db.prepare("SELECT * FROM cases WHERE guild_id = ? ORDER BY case_number DESC LIMIT ? OFFSET ?")
    .all(guildId, PAGE, page * PAGE) as unknown as Array<{ case_number: number; action: string; user_tag: string; user_id: string; moderator_tag: string; reason: string; created_at: number }>;
  const totalCases = (db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const totalWarnings = (db.prepare("SELECT COUNT(*) as cnt FROM warnings WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const totalTickets = (db.prepare("SELECT COUNT(*) as cnt FROM tickets WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const openTickets = (db.prepare("SELECT COUNT(*) as cnt FROM tickets WHERE guild_id = ? AND status = 'open'").get(guildId) as unknown as { cnt: number }).cnt;
  const pages = Math.ceil(totalCases / PAGE);

  res.send(pageWrap(`Guild ${guildId} — Cases`, `${header(token, guildId)}
<div class="main">
  <h2>Guild: <code style="font-size:.9rem">${guildId}</code></h2>
  <div class="stats-row">
    <div class="stat-box"><div class="num">${totalCases}</div><div class="lbl">Total Cases</div></div>
    <div class="stat-box"><div class="num">${totalWarnings}</div><div class="lbl">Total Warnings</div></div>
    <div class="stat-box"><div class="num">${openTickets}</div><div class="lbl">Open Tickets</div></div>
    <div class="stat-box"><div class="num">${totalTickets}</div><div class="lbl">Total Tickets</div></div>
  </div>
  <h3 style="margin-top:1.5rem">Cases (${totalCases} total)</h3>
  <table>
    <tr><th>#</th><th>Action</th><th>User</th><th>Moderator</th><th>Reason</th><th>Date</th></tr>
    ${cases.map(c => `<tr>
      <td><strong>#${c.case_number}</strong></td>
      <td><span class="badge" style="background:${ACTION_COLORS[c.action] ?? "#5865f2"}">${c.action}</span></td>
      <td title="${c.user_id}">${c.user_tag}</td>
      <td>${c.moderator_tag}</td>
      <td>${c.reason.slice(0, 80)}${c.reason.length > 80 ? "…" : ""}</td>
      <td>${new Date(c.created_at * 1000).toLocaleString()}</td>
    </tr>`).join("") || `<tr><td colspan="6" style="color:#8b949e;text-align:center;padding:2rem">No cases yet</td></tr>`}
  </table>
  <div class="nav">
    ${page > 0 ? `<a href="/dashboard/guild/${guildId}${qs(token, { page: page })}">← Prev</a>` : ""}
    <span>Page ${page + 1} of ${Math.max(1, pages)}</span>
    ${page + 1 < pages ? `<a href="/dashboard/guild/${guildId}${qs(token, { page: page + 2 })}">Next →</a>` : ""}
  </div>
</div>`));
});

// ── Warnings ──────────────────────────────────────────────────────────────────
router.get("/guild/:guildId/warnings", (req, res) => {
  const token = authCheck(req, res);
  if (token === null) return;
  const { guildId } = req.params;
  const page = Math.max(0, parseInt((req.query.page as string | undefined) ?? "1") - 1);
  const PAGE = 25;

  const warnings = db.prepare("SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(guildId, PAGE, page * PAGE) as unknown as Array<{ id: number; user_tag: string; user_id: string; reason: string; moderator_tag: string; created_at: number }>;
  const total = (db.prepare("SELECT COUNT(*) as cnt FROM warnings WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const pages = Math.ceil(total / PAGE);

  res.send(pageWrap(`Guild ${guildId} — Warnings`, `${header(token, guildId)}
<div class="main">
  <h2>Guild: <code style="font-size:.9rem">${guildId}</code></h2>
  <h3>Warnings (${total} total)</h3>
  <table>
    <tr><th>ID</th><th>User</th><th>Reason</th><th>Moderator</th><th>Date</th></tr>
    ${warnings.map(w => `<tr>
      <td>#${w.id}</td>
      <td title="${w.user_id}">${w.user_tag}</td>
      <td>${w.reason.slice(0, 100)}${w.reason.length > 100 ? "…" : ""}</td>
      <td>${w.moderator_tag}</td>
      <td>${new Date(w.created_at * 1000).toLocaleString()}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="color:#8b949e;text-align:center;padding:2rem">No warnings yet</td></tr>`}
  </table>
  <div class="nav">
    ${page > 0 ? `<a href="/dashboard/guild/${guildId}/warnings${qs(token, { page: page })}">← Prev</a>` : ""}
    <span>Page ${page + 1} of ${Math.max(1, pages)}</span>
    ${page + 1 < pages ? `<a href="/dashboard/guild/${guildId}/warnings${qs(token, { page: page + 2 })}">Next →</a>` : ""}
  </div>
</div>`));
});

// ── Tickets ───────────────────────────────────────────────────────────────────
router.get("/guild/:guildId/tickets", (req, res) => {
  const token = authCheck(req, res);
  if (token === null) return;
  const { guildId } = req.params;
  const page = Math.max(0, parseInt((req.query.page as string | undefined) ?? "1") - 1);
  const PAGE = 25;

  const tickets = db.prepare("SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(guildId, PAGE, page * PAGE) as unknown as Array<{ id: number; user_tag: string; user_id: string; reason: string | null; status: string; claimed_by_tag: string | null; closed_by_tag: string | null; created_at: number; closed_at: number | null }>;
  const total = (db.prepare("SELECT COUNT(*) as cnt FROM tickets WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const pages = Math.ceil(total / PAGE);
  const STATUS_COLORS: Record<string, string> = { open: "#00cc66", closed: "#888888" };

  res.send(pageWrap(`Guild ${guildId} — Tickets`, `${header(token, guildId)}
<div class="main">
  <h2>Guild: <code style="font-size:.9rem">${guildId}</code></h2>
  <h3>Tickets (${total} total)</h3>
  <table>
    <tr><th>#</th><th>User</th><th>Status</th><th>Reason</th><th>Claimed By</th><th>Closed By</th><th>Opened</th><th>Closed</th></tr>
    ${tickets.map(t => `<tr>
      <td>#${t.id}</td>
      <td title="${t.user_id}">${t.user_tag}</td>
      <td><span class="badge" style="background:${STATUS_COLORS[t.status] ?? "#5865f2"}">${t.status}</span></td>
      <td>${(t.reason ?? "—").slice(0, 60)}</td>
      <td>${t.claimed_by_tag ?? "—"}</td>
      <td>${t.closed_by_tag ?? "—"}</td>
      <td>${new Date(t.created_at * 1000).toLocaleString()}</td>
      <td>${t.closed_at ? new Date(t.closed_at * 1000).toLocaleString() : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="8" style="color:#8b949e;text-align:center;padding:2rem">No tickets yet</td></tr>`}
  </table>
  <div class="nav">
    ${page > 0 ? `<a href="/dashboard/guild/${guildId}/tickets${qs(token, { page: page })}">← Prev</a>` : ""}
    <span>Page ${page + 1} of ${Math.max(1, pages)}</span>
    ${page + 1 < pages ? `<a href="/dashboard/guild/${guildId}/tickets${qs(token, { page: page + 2 })}">Next →</a>` : ""}
  </div>
</div>`));
});

// ── User Search ───────────────────────────────────────────────────────────────
router.get("/guild/:guildId/search", (req, res) => {
  const token = authCheck(req, res);
  if (token === null) return;
  const { guildId } = req.params;
  const query = (req.query.q as string | undefined)?.trim() ?? "";

  let resultsHtml = "";
  if (query) {
    const isId = /^\d{17,19}$/.test(query);
    const userCases = (isId
      ? db.prepare("SELECT * FROM cases WHERE guild_id = ? AND user_id = ? ORDER BY case_number DESC").all(guildId, query)
      : db.prepare("SELECT * FROM cases WHERE guild_id = ? AND user_tag LIKE ? ORDER BY case_number DESC").all(guildId, `%${query}%`)) as unknown as Array<{ case_number: number; action: string; user_tag: string; user_id: string; moderator_tag: string; reason: string; created_at: number }>;
    const userWarnings = (isId
      ? db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC").all(guildId, query)
      : db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_tag LIKE ? ORDER BY created_at DESC").all(guildId, `%${query}%`)) as unknown as Array<{ id: number; user_tag: string; reason: string; moderator_tag: string; created_at: number }>;
    const userTickets = (isId
      ? db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC").all(guildId, query)
      : db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_tag LIKE ? ORDER BY created_at DESC").all(guildId, `%${query}%`)) as unknown as Array<{ id: number; user_tag: string; status: string; claimed_by_tag: string | null; created_at: number }>;

    resultsHtml = `
    <h3 style="margin-top:1.5rem">Cases (${userCases.length})</h3>
    <table><tr><th>#</th><th>Action</th><th>User</th><th>Moderator</th><th>Reason</th><th>Date</th></tr>
    ${userCases.map(c => `<tr><td>#${c.case_number}</td>
      <td><span class="badge" style="background:${ACTION_COLORS[c.action] ?? "#5865f2"}">${c.action}</span></td>
      <td>${c.user_tag}</td><td>${c.moderator_tag}</td>
      <td>${c.reason.slice(0, 80)}${c.reason.length > 80 ? "…" : ""}</td>
      <td>${new Date(c.created_at * 1000).toLocaleString()}</td></tr>`).join("") || `<tr><td colspan="6" style="color:#8b949e;text-align:center;padding:1rem">None</td></tr>`}
    </table>
    <h3 style="margin-top:1.5rem">Warnings (${userWarnings.length})</h3>
    <table><tr><th>ID</th><th>User</th><th>Reason</th><th>Moderator</th><th>Date</th></tr>
    ${userWarnings.map(w => `<tr><td>#${w.id}</td><td>${w.user_tag}</td>
      <td>${w.reason.slice(0, 100)}</td><td>${w.moderator_tag}</td>
      <td>${new Date(w.created_at * 1000).toLocaleString()}</td></tr>`).join("") || `<tr><td colspan="5" style="color:#8b949e;text-align:center;padding:1rem">None</td></tr>`}
    </table>
    <h3 style="margin-top:1.5rem">Tickets (${userTickets.length})</h3>
    <table><tr><th>#</th><th>User</th><th>Status</th><th>Claimed By</th><th>Opened</th></tr>
    ${userTickets.map(t => `<tr><td>#${t.id}</td><td>${t.user_tag}</td>
      <td>${t.status}</td><td>${t.claimed_by_tag ?? "—"}</td>
      <td>${new Date(t.created_at * 1000).toLocaleString()}</td></tr>`).join("") || `<tr><td colspan="5" style="color:#8b949e;text-align:center;padding:1rem">None</td></tr>`}
    </table>`;
  }

  res.send(pageWrap(`Search — ${guildId}`, `${header(token, guildId)}
<div class="main">
  <h2>Search User</h2>
  <p class="muted">Enter a user tag (e.g. thomas#0) or user ID (17–19 digits)</p>
  <form class="search-bar" method="GET" action="/dashboard/guild/${guildId}/search">
    ${token ? `<input type="hidden" name="token" value="${token}">` : ""}
    <input type="text" name="q" value="${query.replace(/"/g, "&quot;")}" placeholder="Username or User ID" autofocus>
    <button type="submit">Search</button>
  </form>
  ${resultsHtml}
</div>`));
});

export default router;

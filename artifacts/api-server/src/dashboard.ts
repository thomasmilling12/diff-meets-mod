import { Router } from "express";
import { db } from "./bot/db/database";

const router = Router();

function authCheck(req: import("express").Request, res: import("express").Response): boolean {
  const token = process.env.DASHBOARD_TOKEN;
  if (!token) return true;
  const provided = (req.query.token as string) ?? req.headers.authorization?.replace("Bearer ", "");
  if (provided !== token) {
    res.status(401).send(`<html><body style="font-family:monospace;padding:2rem;background:#1a1a2e;color:#e0e0e0">
      <h2 style="color:#ff4444">401 Unauthorized</h2>
      <p>Provide <code>?token=YOUR_DASHBOARD_TOKEN</code> in the URL.</p></body></html>`);
    return false;
  }
  return true;
}

router.get("/", (req, res) => {
  if (!authCheck(req, res)) return;

  const guilds = db.prepare("SELECT guild_id FROM guild_config").all() as unknown as { guild_id: string }[];
  const tokenParam = process.env.DASHBOARD_TOKEN ? `?token=${req.query.token ?? ""}` : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DIFF Meets Mod — Dashboard</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3;min-height:100vh}
.header{background:#161b22;border-bottom:1px solid #30363d;padding:1rem 2rem;display:flex;align-items:center;gap:1rem}
.logo{font-size:1.5rem;font-weight:700;color:#5865f2}.subtitle{color:#8b949e;font-size:.9rem}
.main{padding:2rem;max-width:1200px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-top:1.5rem}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1.5rem;transition:border-color .2s}
.card:hover{border-color:#5865f2}.card h3{font-size:1rem;margin-bottom:.5rem;color:#5865f2}
.card a{color:#58a6ff;text-decoration:none;font-family:monospace;font-size:.85rem;word-break:break-all}
.card a:hover{text-decoration:underline}.tag{display:inline-block;background:#21262d;border:1px solid #30363d;
border-radius:4px;padding:2px 8px;font-size:.75rem;color:#8b949e;margin-top:.5rem}
h2{color:#e6edf3;margin-bottom:.5rem}p{color:#8b949e}</style></head>
<body>
<div class="header"><div class="logo">🛡️ DIFF Meets Mod</div><div class="subtitle">Dashboard</div></div>
<div class="main">
  <h2>Guilds (${guilds.length})</h2>
  <p>Click a guild to view its cases and warnings.</p>
  <div class="grid">
    ${guilds.map(g => `<div class="card">
      <h3>Guild</h3>
      <div style="font-family:monospace;font-size:.85rem;color:#e6edf3;margin-bottom:.75rem">${g.guild_id}</div>
      <a href="/dashboard/guild/${g.guild_id}${tokenParam}">View Cases & Warnings →</a>
    </div>`).join("")}
  </div>
</div></body></html>`;
  res.send(html);
});

router.get("/guild/:guildId", (req, res) => {
  if (!authCheck(req, res)) return;
  const { guildId } = req.params;
  const page = Math.max(0, parseInt(req.query.page as string ?? "0") - 1);
  const PAGE = 20;

  const cases = db.prepare("SELECT * FROM cases WHERE guild_id = ? ORDER BY case_number DESC LIMIT ? OFFSET ?")
    .all(guildId, PAGE, page * PAGE) as unknown as Array<{ case_number: number; action: string; user_tag: string; user_id: string; moderator_tag: string; reason: string; created_at: number; active: number }>;

  const totalCases = (db.prepare("SELECT COUNT(*) as cnt FROM cases WHERE guild_id = ?").get(guildId) as unknown as { cnt: number }).cnt;
  const config = db.prepare("SELECT * FROM guild_config WHERE guild_id = ?").get(guildId) as unknown as Record<string, string | number> | undefined;
  const tokenParam = process.env.DASHBOARD_TOKEN ? `?token=${req.query.token ?? ""}` : "";
  const pages = Math.ceil(totalCases / PAGE);

  const ACTION_COLORS: Record<string, string> = {
    BAN: "#ff4444", KICK: "#ff8800", MUTE: "#ffaa00", WARN: "#ffdd00",
    TEMPBAN: "#ff6622", UNBAN: "#44ff88", UNMUTE: "#44ffaa", NOTE: "#8888ff",
  };

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guild ${guildId} — DIFF Meets Mod</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#0d1117;color:#e6edf3}
.header{background:#161b22;border-bottom:1px solid #30363d;padding:1rem 2rem;display:flex;align-items:center;gap:1rem}
.logo{font-size:1.2rem;font-weight:700;color:#5865f2}.main{padding:2rem;max-width:1200px;margin:0 auto}
table{width:100%;border-collapse:collapse;margin-top:1rem;font-size:.875rem}
th{background:#161b22;color:#8b949e;font-weight:600;padding:.75rem 1rem;text-align:left;border-bottom:2px solid #30363d}
td{padding:.65rem 1rem;border-bottom:1px solid #21262d}tr:hover td{background:#161b22}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600;color:#fff}
.config{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1.5rem;margin-top:1.5rem;font-size:.85rem}
.config table{margin-top:.5rem}.config td{padding:.3rem .75rem;color:#8b949e}.config td:first-child{color:#e6edf3;font-weight:500}
.nav{display:flex;gap:.5rem;margin-top:1rem;align-items:center}.nav a{color:#58a6ff;text-decoration:none;padding:.4rem .8rem;
background:#21262d;border-radius:4px;font-size:.85rem}.nav a:hover{background:#30363d}.nav span{color:#8b949e;font-size:.85rem}
h2{color:#e6edf3;margin-top:1.5rem}.back{color:#58a6ff;text-decoration:none;font-size:.85rem}
.back:hover{text-decoration:underline}</style></head>
<body>
<div class="header">
  <div class="logo">🛡️ DIFF Meets Mod</div>
  <a class="back" href="/dashboard${tokenParam}">← All Guilds</a>
</div>
<div class="main">
  <h2>Guild: <code style="font-size:1rem">${guildId}</code></h2>
  <h2 style="margin-top:1.5rem">Cases (${totalCases} total)</h2>
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
    ${page > 0 ? `<a href="/dashboard/guild/${guildId}${tokenParam}&page=${page}">← Prev</a>` : ""}
    <span>Page ${page + 1} of ${Math.max(1, pages)}</span>
    ${page + 1 < pages ? `<a href="/dashboard/guild/${guildId}${tokenParam}&page=${page + 2}">Next →</a>` : ""}
  </div>
  ${config ? `<div class="config">
    <strong>Config</strong>
    <table>
      <tr><td>Mod Log Channel</td><td>${config.log_channel_id ?? "Not set"}</td></tr>
      <tr><td>Welcome Channel</td><td>${config.welcome_channel_id ?? "Not set"}</td></tr>
      <tr><td>Auto-Role</td><td>${config.auto_role_id ?? "Not set"}</td></tr>
      <tr><td>Anti-Spam</td><td>${config.automod_anti_spam ? "On" : "Off"}</td></tr>
      <tr><td>Anti-Phishing</td><td>${config.automod_anti_phishing ? "On" : "Off"}</td></tr>
    </table>
  </div>` : ""}
</div></body></html>`;
  res.send(html);
});

export default router;

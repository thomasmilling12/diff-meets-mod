import { db } from "./database";

export interface EscalationRule {
  id: number;
  guild_id: string;
  warn_count: number;
  action: string;
  duration: number | null;
}

export function getEscalationRules(guildId: string): EscalationRule[] {
  return db.prepare("SELECT * FROM escalation_rules WHERE guild_id = ? ORDER BY warn_count")
    .all(guildId) as unknown as EscalationRule[];
}

export function addEscalationRule(guildId: string, warnCount: number, action: string, duration?: number): void {
  db.prepare("INSERT OR REPLACE INTO escalation_rules (guild_id, warn_count, action, duration) VALUES (?, ?, ?, ?)")
    .run(guildId, warnCount, action.toUpperCase(), duration ?? null);
}

export function removeEscalationRule(guildId: string, warnCount: number): boolean {
  const r = db.prepare("DELETE FROM escalation_rules WHERE guild_id = ? AND warn_count = ?").run(guildId, warnCount);
  return (r.changes as number) > 0;
}

export function getEscalationForCount(guildId: string, count: number): EscalationRule | null {
  return (db.prepare("SELECT * FROM escalation_rules WHERE guild_id = ? AND warn_count = ?")
    .get(guildId, count) as unknown as EscalationRule) ?? null;
}

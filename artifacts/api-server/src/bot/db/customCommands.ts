import { db } from "./database";

export interface CustomCommand {
  id: number;
  guild_id: string;
  trigger: string;
  response: string;
}

export function addCustomCommand(guildId: string, trigger: string, response: string): void {
  db.prepare("INSERT OR REPLACE INTO custom_commands (guild_id, trigger, response) VALUES (?, ?, ?)")
    .run(guildId, trigger, response);
}

export function removeCustomCommand(guildId: string, trigger: string): boolean {
  const result = db.prepare("DELETE FROM custom_commands WHERE guild_id = ? AND trigger = ?").run(guildId, trigger);
  return (result.changes as number) > 0;
}

export function getCustomCommands(guildId: string): CustomCommand[] {
  return db.prepare("SELECT * FROM custom_commands WHERE guild_id = ? ORDER BY trigger")
    .all(guildId) as unknown as CustomCommand[];
}

export function findCustomCommand(guildId: string, trigger: string): CustomCommand | null {
  return (db.prepare("SELECT * FROM custom_commands WHERE guild_id = ? AND trigger = ?")
    .get(guildId, trigger) as unknown as CustomCommand) ?? null;
}

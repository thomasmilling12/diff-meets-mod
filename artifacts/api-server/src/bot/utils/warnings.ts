interface Warning {
  reason: string;
  moderator: string;
  timestamp: number;
}

const warningsStore: Map<string, Warning[]> = new Map();

function key(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function addWarning(guildId: string, userId: string, reason: string, moderator: string): void {
  const k = key(guildId, userId);
  const current = warningsStore.get(k) ?? [];
  current.push({ reason, moderator, timestamp: Date.now() });
  warningsStore.set(k, current);
}

export function getWarnings(guildId: string, userId: string): Warning[] {
  return warningsStore.get(key(guildId, userId)) ?? [];
}

export function clearWarnings(guildId: string, userId: string): void {
  warningsStore.delete(key(guildId, userId));
}

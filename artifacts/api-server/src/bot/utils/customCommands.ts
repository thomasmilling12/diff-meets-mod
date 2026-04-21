interface CustomCommand {
  trigger: string;
  response: string;
}

const customCommandsStore: Map<string, CustomCommand[]> = new Map();

export function addCustomCommand(guildId: string, trigger: string, response: string): void {
  const cmds = customCommandsStore.get(guildId) ?? [];
  const existing = cmds.findIndex((c) => c.trigger === trigger);
  if (existing !== -1) {
    cmds[existing] = { trigger, response };
  } else {
    cmds.push({ trigger, response });
  }
  customCommandsStore.set(guildId, cmds);
}

export function removeCustomCommand(guildId: string, trigger: string): boolean {
  const cmds = customCommandsStore.get(guildId) ?? [];
  const idx = cmds.findIndex((c) => c.trigger === trigger);
  if (idx === -1) return false;
  cmds.splice(idx, 1);
  customCommandsStore.set(guildId, cmds);
  return true;
}

export function getCustomCommands(guildId: string): CustomCommand[] {
  return customCommandsStore.get(guildId) ?? [];
}

export function findCustomCommand(guildId: string, trigger: string): CustomCommand | undefined {
  return (customCommandsStore.get(guildId) ?? []).find((c) => c.trigger === trigger);
}

import { client, commands } from "./client";
import { botLogger } from "./logger";
import { registerReadyEvent } from "./events/ready";
import { registerInteractionCreateEvent } from "./events/interactionCreate";
import { registerMessageCreateEvent } from "./events/messageCreate";
import { deployCommands } from "./deploy-commands";

import banCommand from "./commands/moderation/ban";
import unbanCommand from "./commands/moderation/unban";
import kickCommand from "./commands/moderation/kick";
import muteCommand from "./commands/moderation/mute";
import unmuteCommand from "./commands/moderation/unmute";
import warnCommand from "./commands/moderation/warn";
import warningsCommand from "./commands/moderation/warnings";
import purgeCommand from "./commands/moderation/purge";
import roleCommand from "./commands/roles/role";
import logCommand from "./commands/config/log";
import automodCommand from "./commands/config/automod";
import customcmdCommand from "./commands/config/customcmd";
import pingCommand from "./commands/utility/ping";
import userinfoCommand from "./commands/utility/userinfo";
import serverinfoCommand from "./commands/utility/serverinfo";
import helpCommand from "./commands/utility/help";

const allCommands = [
  banCommand,
  unbanCommand,
  kickCommand,
  muteCommand,
  unmuteCommand,
  warnCommand,
  warningsCommand,
  purgeCommand,
  roleCommand,
  logCommand,
  automodCommand,
  customcmdCommand,
  pingCommand,
  userinfoCommand,
  serverinfoCommand,
  helpCommand,
];

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    botLogger.error("DISCORD_BOT_TOKEN environment variable is not set. Bot will not start.");
    return;
  }

  for (const cmd of allCommands) {
    commands.set(cmd.data.name, cmd);
  }

  registerReadyEvent(client);
  registerInteractionCreateEvent(client);
  registerMessageCreateEvent(client);

  client.once("clientReady", async (c) => {
    try {
      await deployCommands(c.user.id);
    } catch (err) {
      botLogger.error({ err }, "Failed to deploy slash commands");
    }
  });

  try {
    await client.login(token);
  } catch (err) {
    botLogger.error({ err }, "Failed to login to Discord");
  }
}

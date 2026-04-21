import "./db/database";
import { client, commands } from "./client";
import { botLogger } from "./logger";
import { registerReadyEvent } from "./events/ready";
import { registerInteractionCreateEvent } from "./events/interactionCreate";
import { registerMessageCreateEvent } from "./events/messageCreate";
import { registerGuildMemberAddEvent } from "./events/guildMemberAdd";
import { deployCommands } from "./deploy-commands";
import { startTempBanChecker } from "./utils/tempbanChecker";

import banCommand from "./commands/moderation/ban";
import unbanCommand from "./commands/moderation/unban";
import kickCommand from "./commands/moderation/kick";
import muteCommand from "./commands/moderation/mute";
import unmuteCommand from "./commands/moderation/unmute";
import warnCommand from "./commands/moderation/warn";
import warningsCommand from "./commands/moderation/warnings";
import purgeCommand from "./commands/moderation/purge";
import tempbanCommand from "./commands/moderation/tempban";
import lockCommand from "./commands/moderation/lock";
import slowmodeCommand from "./commands/moderation/slowmode";
import noteCommand from "./commands/moderation/note";
import caseCommand from "./commands/moderation/case";
import roleCommand from "./commands/roles/role";
import selfRoleCommand from "./commands/roles/selfrole";
import joinRoleCommand from "./commands/roles/joinrole";
import leaveRoleCommand from "./commands/roles/leaverole";
import roleIdCommand from "./commands/roles/roleid";
import massRoleCommand from "./commands/roles/massrole";
import logCommand from "./commands/config/log";
import automodCommand from "./commands/config/automod";
import customcmdCommand from "./commands/config/customcmd";
import welcomeCommand from "./commands/config/welcome";
import autoroleCommand from "./commands/config/autorole";
import wordfilterCommand from "./commands/config/wordfilter";
import buttonrolesCommand from "./commands/config/buttonroles";
import pingCommand from "./commands/utility/ping";
import userinfoCommand from "./commands/utility/userinfo";
import serverinfoCommand from "./commands/utility/serverinfo";
import helpCommand from "./commands/utility/help";
import announceCommand from "./commands/utility/announce";

const allCommands = [
  banCommand, unbanCommand, kickCommand, muteCommand, unmuteCommand,
  warnCommand, warningsCommand, purgeCommand, tempbanCommand, lockCommand,
  slowmodeCommand, noteCommand, caseCommand,
  roleCommand, selfRoleCommand, joinRoleCommand, leaveRoleCommand, roleIdCommand, massRoleCommand,
  logCommand, automodCommand, customcmdCommand, welcomeCommand,
  autoroleCommand, wordfilterCommand, buttonrolesCommand,
  pingCommand, userinfoCommand, serverinfoCommand, helpCommand, announceCommand,
];

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    botLogger.error("DISCORD_BOT_TOKEN is not set. Bot will not start.");
    return;
  }

  for (const cmd of allCommands) {
    commands.set(cmd.data.name, cmd);
  }

  registerReadyEvent(client);
  registerInteractionCreateEvent(client);
  registerMessageCreateEvent(client);
  registerGuildMemberAddEvent(client);

  client.once("clientReady", async (c) => {
    try {
      await deployCommands(c.user.id);
    } catch (err) {
      botLogger.error({ err }, "Failed to deploy slash commands");
    }
    startTempBanChecker(client);
  });

  try {
    await client.login(token);
  } catch (err) {
    botLogger.error({ err }, "Failed to login to Discord");
  }
}

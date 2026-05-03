import "./db/database";
import { client, commands } from "./client";
import { botLogger } from "./logger";
import { registerReadyEvent } from "./events/ready";
import { registerInteractionCreateEvent } from "./events/interactionCreate";
import { registerMessageCreateEvent } from "./events/messageCreate";
import { registerGuildMemberAddEvent } from "./events/guildMemberAdd";
import { registerGuildMemberRemoveEvent } from "./events/guildMemberRemove";
import { registerGuildMemberUpdateEvent } from "./events/guildMemberUpdate";
import { registerMessageUpdateEvent } from "./events/messageUpdate";
import { registerMessageDeleteEvent } from "./events/messageDelete";
import { registerVoiceStateUpdateEvent } from "./events/voiceStateUpdate";
import { registerMessageReactionAddEvent } from "./events/messageReactionAdd";
import { registerMessageReactionRemoveEvent } from "./events/messageReactionRemove";
import { registerServerEvents } from "./events/serverEvents";
import { deployCommands } from "./deploy-commands";
import { startTempBanChecker } from "./utils/tempbanChecker";
import { startStatsUpdater } from "./utils/statsUpdater";
import { startGiveawayChecker } from "./utils/giveawayManager";
import { startReminderChecker } from "./utils/reminderChecker";
import { startScheduledAnnouncementChecker } from "./utils/scheduledAnnouncementChecker";

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
import ticketCommand from "./commands/moderation/ticket";
import closeticketCommand from "./commands/moderation/closeticket";

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
import logconfigCommand from "./commands/config/logconfig";
import escalationconfigCommand from "./commands/config/escalationconfig";
import raidconfigCommand from "./commands/config/raidconfig";
import ticketsetupCommand from "./commands/config/ticketsetup";
import verifysetupCommand from "./commands/config/verifysetup";
import statschannelCommand from "./commands/config/statschannel";
import starboardCommand from "./commands/config/starboard";
import modmailCommand from "./commands/config/modmail";
import invitetrackingCommand from "./commands/config/invitetracking";
import autothreadCommand from "./commands/config/autothread";
import configstatusCommand from "./commands/config/configstatus";
import reactionrolesCommand from "./commands/config/reactionroles";
import presenceCommand from "./commands/config/presence";

import pingCommand from "./commands/utility/ping";
import userinfoCommand from "./commands/utility/userinfo";
import serverinfoCommand from "./commands/utility/serverinfo";
import helpCommand from "./commands/utility/help";
import announceCommand from "./commands/utility/announce";
import pollCommand from "./commands/utility/poll";
import giveawayCommand from "./commands/utility/giveaway";
import funCommand from "./commands/utility/fun";
import backupCommand from "./commands/utility/backup";
import remindCommand from "./commands/utility/remind";
import afkCommand from "./commands/utility/afk";
import reportCommand from "./commands/utility/report";
import scheduleCommand from "./commands/utility/schedule";

import quickWarnCommand from "./commands/contextmenus/warnUser";
import quickBanCommand from "./commands/contextmenus/banUser";
import deleteMessageCommand from "./commands/contextmenus/deleteMessage";

const allCommands = [
  banCommand, unbanCommand, kickCommand, muteCommand, unmuteCommand,
  warnCommand, warningsCommand, purgeCommand, tempbanCommand, lockCommand,
  slowmodeCommand, noteCommand, caseCommand, ticketCommand, closeticketCommand,

  roleCommand, selfRoleCommand, joinRoleCommand, leaveRoleCommand, roleIdCommand, massRoleCommand,

  logCommand, automodCommand, customcmdCommand, welcomeCommand,
  autoroleCommand, wordfilterCommand, buttonrolesCommand,
  logconfigCommand, escalationconfigCommand, raidconfigCommand,
  ticketsetupCommand, verifysetupCommand, statschannelCommand,
  starboardCommand, modmailCommand, invitetrackingCommand, autothreadCommand,
  configstatusCommand, reactionrolesCommand, presenceCommand,

  pingCommand, userinfoCommand, serverinfoCommand, helpCommand, announceCommand, pollCommand,
  giveawayCommand, funCommand, backupCommand, remindCommand, afkCommand, reportCommand, scheduleCommand,

  quickWarnCommand, quickBanCommand, deleteMessageCommand,
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
  registerGuildMemberRemoveEvent(client);
  registerGuildMemberUpdateEvent(client);
  registerMessageUpdateEvent(client);
  registerMessageDeleteEvent(client);
  registerVoiceStateUpdateEvent(client);
  registerMessageReactionAddEvent(client);
  registerMessageReactionRemoveEvent(client);
  registerServerEvents(client);

  client.once("clientReady", async (c) => {
    try {
      await deployCommands(c.user.id);
    } catch (err) {
      botLogger.error({ err }, "Failed to deploy slash commands");
    }
    startTempBanChecker(client);
    startStatsUpdater(client);
    startGiveawayChecker(client);
    startReminderChecker(client);
    startScheduledAnnouncementChecker(client);
  });

  try {
    await client.login(token);
  } catch (err) {
    botLogger.error({ err }, "Failed to login to Discord");
  }
}

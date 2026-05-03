import { Client, Events, GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { checkRaid } from "../utils/raidProtectionHandler";
import { getInviteTracking, upsertInviteUse, getInviteUse, setMemberInvite } from "../db/inviteTracking";
import { botLogger } from "../logger";

const NEW_ACCOUNT_DAYS = 7;
const NEW_ACCOUNT_MS = NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;

export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const config = getConfig(guildId);

    await checkRaid(member).catch(() => {});

    // ── Invite tracking ───────────────────────────────────────────────────────
    const inviteConfig = getInviteTracking(guildId);
    let inviterInfo: { id: string | null; code: string | null } = { id: null, code: null };

    if (inviteConfig.enabled) {
      try {
        const freshInvites = await member.guild.invites.fetch();
        for (const invite of freshInvites.values()) {
          if (!invite.inviter) continue;
          const stored = getInviteUse(guildId, invite.code);
          const storedUses = stored?.uses ?? 0;
          const freshUses = invite.uses ?? 0;
          if (freshUses > storedUses) {
            inviterInfo = { id: invite.inviter.id, code: invite.code };
            upsertInviteUse(guildId, invite.inviter.id, invite.inviter.tag, invite.code, freshUses);
            break;
          }
          upsertInviteUse(guildId, invite.inviter.id, invite.inviter.tag, invite.code, freshUses);
        }
      } catch { /* no invite perms */ }

      setMemberInvite(guildId, member.id, inviterInfo.id, inviterInfo.code);

      if (inviteConfig.log_channel_id) {
        const logChannel = member.guild.channels.cache.get(inviteConfig.log_channel_id) as TextChannel | undefined;
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("Member Joined — Invite Info")
            .addFields(
              { name: "User", value: `${member.user.tag} (${member.user.id})`, inline: true },
              { name: "Invited By", value: inviterInfo.id ? `<@${inviterInfo.id}>` : "Unknown", inline: true },
              { name: "Invite Code", value: inviterInfo.code ? `\`${inviterInfo.code}\`` : "Unknown", inline: true },
            ).setTimestamp();
          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }

    // ── Auto-role ─────────────────────────────────────────────────────────────
    if (config.auto_role_id) {
      const role = member.guild.roles.cache.get(config.auto_role_id);
      if (role) {
        await member.roles.add(role).catch((err: unknown) => {
          botLogger.warn({ err, userId: member.id }, "Failed to assign auto-role");
        });
      }
    }

    // ── Welcome message ───────────────────────────────────────────────────────
    if (config.welcome_channel_id && config.welcome_message) {
      const channel = member.guild.channels.cache.get(config.welcome_channel_id) as TextChannel | undefined;
      if (channel) {
        const msg = config.welcome_message
          .replace("{user}", member.toString())
          .replace("{server}", member.guild.name)
          .replace("{count}", String(member.guild.memberCount));
        await channel.send(msg).catch((err: unknown) => {
          botLogger.warn({ err }, "Failed to send welcome message");
        });
      }
    }

    // ── Member join log + anti-alt detection ──────────────────────────────────
    if (config.log_members_channel_id) {
      const logChannel = member.guild.channels.cache.get(config.log_members_channel_id) as TextChannel | undefined;
      if (logChannel) {
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        const isNewAccount = accountAgeMs < NEW_ACCOUNT_MS;
        const ageDays = Math.floor(accountAgeMs / 86_400_000);

        const embed = new EmbedBuilder()
          .setColor(isNewAccount ? 0xff8800 : 0x00cc66)
          .setTitle(isNewAccount ? "⚠️ New Account Joined" : "Member Joined")
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: "User", value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: "Account Age", value: `${ageDays} day(s)`, inline: true },
            { name: "Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "Members Now", value: `${member.guild.memberCount}`, inline: true },
            ...(inviteConfig.enabled && inviterInfo.id ? [{ name: "Invited By", value: `<@${inviterInfo.id}>`, inline: true }] : []),
          );

        if (isNewAccount) {
          embed.setDescription(`⚠️ **Possible alt account** — this account is only **${ageDays} day(s)** old.`);
        }

        embed.setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  });
}

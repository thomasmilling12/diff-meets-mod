const PHISHING_DOMAINS = new Set([
  "discord-nitro.gift", "discordnitro.gift", "discord-gift.xyz", "discordgift.xyz",
  "free-nitro.xyz", "freenitroo.com", "steamcommunity.ru", "steamcommunity.gift",
  "steamgift.gg", "steam-trade.xyz", "discord.gg.cx", "discordapp.io",
  "disocrd.com", "dlscord.com", "dicsord.com", "discordc.com", "discord.io",
  "nitro-discord.com", "discordnitro.cc", "discord-free.xyz", "claim-discord.xyz",
  "discord-nîtro.com", "epicgames.com.ru", "epicstore.gift", "roblox.gift",
]);

const PHISHING_PATTERNS = [
  /discord[\s-]?nitro[\s-]?free/i,
  /free[\s-]?nitro/i,
  /steam[\s-]?gift/i,
  /click[\s-]?here[\s-]?to[\s-]?claim/i,
  /you[\s-]?have[\s-]?won/i,
];

export function isPhishingLink(content: string): boolean {
  try {
    const urlRegex = /https?:\/\/([^\s/]+)/g;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      const hostname = match[1].toLowerCase();
      if (PHISHING_DOMAINS.has(hostname)) return true;
      for (const pattern of PHISHING_PATTERNS) {
        if (pattern.test(content)) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

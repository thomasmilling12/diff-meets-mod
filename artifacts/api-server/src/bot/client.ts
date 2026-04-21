import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import type { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";

export interface Command {
  data: {
    name: string;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

export const commands = new Collection<string, Command>();

/**
 * Run once (or after command changes) to register slash commands with Discord.
 * Usage: npm run bot:deploy-commands
 */
import { REST, Routes } from "discord.js";
import * as offer from "./commands/offer";
import * as claim from "./commands/claim";

const token = process.env.DISCORD_BOT_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID; // set for instant updates in one guild; omit for global

const commands = [offer.data.toJSON(), claim.data.toJSON()];
const rest = new REST().setToken(token);

const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

rest
  .put(route, { body: commands })
  .then(() => console.log(`Registered ${commands.length} commands (${guildId ? "guild" : "global"})`))
  .catch(console.error);

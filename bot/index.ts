import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Interaction,
} from "discord.js";
import * as offer from "./commands/offer";
import * as claim from "./commands/claim";

type Command = {
  data: { name: string; toJSON(): unknown };
  execute(interaction: never): Promise<void>;
  autocomplete?(interaction: never): Promise<void>;
};

const commands = new Collection<string, Command>();
commands.set(offer.data.name, offer as unknown as Command);
commands.set(claim.data.name, claim as unknown as Command);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Bot ready: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commands.get(interaction.commandName);
    if (command?.autocomplete) {
      await command.autocomplete(interaction as never).catch(console.error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  await command.execute(interaction as never).catch(async (err) => {
    console.error(err);
    const msg = { content: "Something went wrong.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);

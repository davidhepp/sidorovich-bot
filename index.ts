// Require the necessary discord.js classes
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Collection,
  ActivityType,
} from "discord.js";
import fs from "fs";
import path from "path";
import { addKillaKill, resetTodayKillaStats } from "./db/stores/killaStore";
import { buildKillaMessage } from "./commands/utility/killa";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN is not defined in environment variables.");
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  client.user?.setActivity("v" + process.env.npm_package_version, {
    type: ActivityType.Custom,
  });
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith("killa:add:")) {
        const [, , userId] = interaction.customId.split(":");

        if (interaction.user.id !== userId) {
          await interaction.reply({
            content:
              "You can only update your own Killa counter. Use /killa show to start your own.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const stats = addKillaKill(userId);
        const message = buildKillaMessage(interaction.user, stats);
        await interaction.update(message);
        return;
      }

      if (interaction.customId.startsWith("killa:reset:")) {
        const [, , userId] = interaction.customId.split(":");

        if (interaction.user.id !== userId) {
          await interaction.reply({
            content:
              "You can only reset your own Killa counter. Use /killa show to start your own.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const stats = resetTodayKillaStats(userId);
        const message = buildKillaMessage(interaction.user, stats);
        await interaction.update(message);
        return;
      }
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "There was an error while handling this button.",
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Log in to Discord with your client's token
client.login(token);

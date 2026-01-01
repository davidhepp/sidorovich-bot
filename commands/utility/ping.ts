import { SlashCommandBuilder, CommandInteraction } from "discord.js";

new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!");

export async function execute(interaction: CommandInteraction) {
  await interaction.reply("Pong!");
}

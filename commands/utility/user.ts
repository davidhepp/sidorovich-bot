import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("user")
  .setDescription("Provides information about the user.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply("This command can only be used in a server.");
  }
  const member = interaction.member as GuildMember;

  await interaction.reply(
    `This command was run by ${interaction.user.tag}, who joined on ${member?.joinedAt}.`
  );
}

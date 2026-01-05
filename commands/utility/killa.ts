import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { getKillaStats, resetTodayKillaStats } from "@db/stores/killaStore";
import {
  formatLastKill,
  formatAverageTimeToCompletion,
  formatTodayAverage,
  renderProgressBar,
} from "@lib/killa/format";
import type { KillaStats } from "@db/stores/killaStore";

export const data = new SlashCommandBuilder()
  .setName("killa")
  .setDescription("Track your Killa kills")
  .addSubcommand((subcommand) =>
    subcommand.setName("show").setDescription("Show your Killa progress")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset")
      .setDescription("Reset today's Killa counter & pace for yourself")
  );

export function buildKillaMessage(user: User, stats: KillaStats) {
  const KILLA_EMOJI = "<:killa:1192623748017299566>";
  const goal = 100;

  const { bar } = renderProgressBar(stats.totalKills, goal);

  const embed = new EmbedBuilder()
    .setTitle(`${KILLA_EMOJI} Counter`)
    .setDescription(`Operator <@${user.id}> \n`)
    .addFields(
      {
        name: "Total kills",
        value: `** ${stats.totalKills} / ${goal}**`,
        inline: true,
      },
      {
        name: "Kills today",
        value: `**${stats.killsToday}**`,
        inline: true,
      },
      {
        name: "Progress",
        // percent doesnt make sense sinc it's 100 total
        // value: `${bar} **${percent}%**`,
        value: `${bar}`,
        inline: false,
      },
      {
        name: "Pace",
        value: `Last kill: **${formatLastKill(
          stats
        )}**\nAverage today: **${formatTodayAverage(stats)}**
      Average time to completion: **${formatAverageTimeToCompletion(
        stats,
        goal
      )}**`,
        inline: false,
      }
    )
    .setFooter({ text: "Tracksuit Soon™" })
    .setColor(0x00ae86)
    .setTimestamp(new Date());

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`killa:add:${user.id}`)
      .setLabel("+1")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`killa:reset:${user.id}`)
      .setLabel("Reset today")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(stats.killsToday === 0),
    new ButtonBuilder()
      .setCustomId(`killa:remove:${user.id}`)
      .setLabel("-1")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(stats.totalKills === 0)
  );

  return { embeds: [embed], components: [row] };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply("This command can only be used in a server.");
  }

  const sub = interaction.options.getSubcommand();
  if (sub === "show") {
    const stats = await getKillaStats(interaction.user.id);
    const message = buildKillaMessage(interaction.user, stats);

    await interaction.reply(message);
    return;
  }

  if (sub === "reset") {
    const stats = await resetTodayKillaStats(interaction.user.id);
    const message = buildKillaMessage(interaction.user, stats);

    await interaction.reply({
      content: "Today's Killa counter and pace have been reset.",
      ...message,
    });
    return;
  }

  await interaction.reply("Unknown subcommand.");
}

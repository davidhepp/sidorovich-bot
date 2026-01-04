import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import {
  getKillaStats,
  resetTodayKillaStats,
} from "../../db/stores/killaStore";
import type { KillaStats } from "../../db/stores/killaStore";

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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours && !minutes) parts.push(`${seconds}s`);

  return parts.slice(0, 2).join(" ");
}

function formatLastKill(stats: KillaStats): string {
  if (stats.lastIntervalMs != null) {
    return formatDuration(stats.lastIntervalMs);
  }

  return "N/A";
}

function formatTodayAverage(stats: KillaStats): string {
  if (stats.todayAvgIntervalMs != null && stats.killsToday >= 2) {
    return formatDuration(stats.todayAvgIntervalMs);
  }

  return "N/A";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function renderProgressBar(
  current: number,
  total: number,
  size = 14,
  filledChar = "█",
  emptyChar = "░"
): { bar: string; percent: number } {
  const safeTotal = total > 0 ? total : 1;
  const ratio = clamp(current / safeTotal, 0, 1);
  const filled = Math.round(ratio * size);
  const bar = filledChar.repeat(filled) + emptyChar.repeat(size - filled);
  const percent = Math.round(ratio * 100);

  return { bar, percent };
}

export function buildKillaMessage(user: User, stats: KillaStats) {
  // const remaining = Math.max(0, 100 - stats.totalKills);
  const KILLA_EMOJI = "<:killa:1192623748017299566>";
  const goal = 100;
  //   const { bar, percent } = renderProgressBar(stats.totalKills, goal);

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
        )}**\nAverage (today): **${formatTodayAverage(stats)}**`,
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
    const stats = getKillaStats(interaction.user.id);
    const message = buildKillaMessage(interaction.user, stats);

    await interaction.reply(message);
    return;
  }

  if (sub === "reset") {
    const stats = resetTodayKillaStats(interaction.user.id);
    const message = buildKillaMessage(interaction.user, stats);

    await interaction.reply({
      content: "Today's Killa counter and pace have been reset.",
      ...message,
    });
    return;
  }

  await interaction.reply("Unknown subcommand.");
}

import type { KillaStats } from "../../db/stores/killaStore";
import { clamp } from "../../lib/utils";

export function formatDuration(ms: number): string {
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

export function formatLastKill(stats: KillaStats): string {
  if (stats.lastIntervalMs != null) {
    return formatDuration(stats.lastIntervalMs);
  }

  return "N/A";
}

export function formatTodayAverage(stats: KillaStats): string {
  if (stats.todayAvgIntervalMs != null && stats.killsToday >= 2) {
    return formatDuration(stats.todayAvgIntervalMs);
  }

  return "N/A";
}

export function renderProgressBar(
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

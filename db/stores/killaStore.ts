import { asc, desc, eq } from "drizzle-orm";
import { db } from "@db/db";
import { killaKills, killaResets } from "@db/schema";

export interface KillaStats {
  totalKills: number;
  lastIntervalMs: number | null;
  todayAvgIntervalMs: number | null;
  killsToday: number;
}

function getStartOfToday(): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start;
}

async function getEffectiveTodayStart(userId: string): Promise<Date> {
  const startOfToday = getStartOfToday();

  const rows = await db
    .select({ resetAfter: killaResets.resetAfter })
    .from(killaResets)
    .where(eq(killaResets.userId, userId))
    .limit(1);

  const row = rows[0];
  if (row?.resetAfter != null && row.resetAfter > startOfToday) {
    return row.resetAfter;
  }

  return startOfToday;
}

export async function getKillaStats(userId: string): Promise<KillaStats> {
  const rows = await db
    .select({ timestamp: killaKills.timestamp })
    .from(killaKills)
    .where(eq(killaKills.userId, userId))
    .orderBy(asc(killaKills.timestamp));

  const totalKills = rows.length;

  let lastIntervalMs: number | null = null;
  if (totalKills >= 2) {
    const lastRow = rows[totalKills - 1];
    const prevRow = rows[totalKills - 2];
    if (lastRow && prevRow) {
      lastIntervalMs =
        lastRow.timestamp.getTime() - prevRow.timestamp.getTime();
    }
  }

  const effectiveTodayStart = await getEffectiveTodayStart(userId);
  const todayRows = rows.filter((row) => row.timestamp >= effectiveTodayStart);
  const killsToday = todayRows.length;

  let todayAvgIntervalMs: number | null = null;
  if (killsToday >= 2) {
    const firstRow = todayRows[0];
    const lastRow = todayRows[todayRows.length - 1];
    if (firstRow && lastRow) {
      const first = firstRow.timestamp.getTime();
      const last = lastRow.timestamp.getTime();
      todayAvgIntervalMs = (last - first) / (killsToday - 1);
    }
  }

  return {
    totalKills,
    lastIntervalMs,
    todayAvgIntervalMs,
    killsToday,
  };
}

export async function removeKillaKill(userId: string): Promise<KillaStats> {
  const rows = await db
    .select({ id: killaKills.id })
    .from(killaKills)
    .where(eq(killaKills.userId, userId))
    .orderBy(desc(killaKills.timestamp))
    .limit(1);

  const row = rows[0];
  if (row?.id != null) {
    await db.delete(killaKills).where(eq(killaKills.id, row.id));
  }

  return getKillaStats(userId);
}

export async function addKillaKill(userId: string): Promise<KillaStats> {
  const now = new Date();

  await db.insert(killaKills).values({ userId, timestamp: now });
  return getKillaStats(userId);
}

export async function resetTodayKillaStats(
  userId: string
): Promise<KillaStats> {
  const now = new Date();

  await db
    .insert(killaResets)
    .values({ userId, resetAfter: now })
    .onConflictDoUpdate({
      target: killaResets.userId,
      set: { resetAfter: now },
    });

  return getKillaStats(userId);
}

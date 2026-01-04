import { Database } from "bun:sqlite";
import fs from "node:fs";

export interface KillaStats {
  totalKills: number;
  lastIntervalMs: number | null;
  todayAvgIntervalMs: number | null;
  killsToday: number;
}

const dbDirectory = "db/sqlite";

// Ensure the SQLite directory exists relative to the project root
fs.mkdirSync(dbDirectory, { recursive: true });

const db = new Database(`${dbDirectory}/killa.sqlite`, { create: true });

db.run(
  `CREATE TABLE IF NOT EXISTS killa_kills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`
);

db.run(
  `CREATE TABLE IF NOT EXISTS killa_resets (
    user_id TEXT PRIMARY KEY,
    reset_after INTEGER NOT NULL
  )`
);

function getStartOfToday(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.getTime();
}

function getEffectiveTodayStart(userId: string): number {
  const startOfToday = getStartOfToday();
  const row = db
    .query("SELECT reset_after FROM killa_resets WHERE user_id = ?")
    .get(userId) as { reset_after: number } | null;

  if (row && row.reset_after > startOfToday) {
    return row.reset_after;
  }

  return startOfToday;
}

export function getKillaStats(userId: string): KillaStats {
  const statement = db.query(
    "SELECT timestamp FROM killa_kills WHERE user_id = ? ORDER BY timestamp ASC"
  );
  const rows = statement.all(userId) as { timestamp: number }[];

  const totalKills = rows.length;

  let lastIntervalMs: number | null = null;
  if (totalKills >= 2) {
    const lastRow = rows[totalKills - 1];
    const prevRow = rows[totalKills - 2];
    if (lastRow && prevRow) {
      lastIntervalMs = lastRow.timestamp - prevRow.timestamp;
    }
  }

  const effectiveTodayStart = getEffectiveTodayStart(userId);
  const todayRows = rows.filter((row) => row.timestamp >= effectiveTodayStart);
  const killsToday = todayRows.length;

  let todayAvgIntervalMs: number | null = null;
  if (killsToday >= 2) {
    const firstRow = todayRows[0];
    const lastRow = todayRows[todayRows.length - 1];
    if (firstRow && lastRow) {
      const first = firstRow.timestamp;
      const last = lastRow.timestamp;
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

export function removeKillaKill(userId: string): KillaStats {
  const row = db
    .query(
      "SELECT id FROM killa_kills WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1"
    )
    .get(userId) as { id: number } | null;
  if (row) {
    db.query("DELETE FROM killa_kills WHERE id = ?").run(row.id);
  }
  return getKillaStats(userId);
}

export function addKillaKill(userId: string): KillaStats {
  const now = Date.now();
  db.query("INSERT INTO killa_kills (user_id, timestamp) VALUES (?, ?)").run(
    userId,
    now
  );
  return getKillaStats(userId);
}

export function resetTodayKillaStats(userId: string): KillaStats {
  const now = Date.now();

  db.query(
    `INSERT INTO killa_resets (user_id, reset_after)
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET reset_after = excluded.reset_after`
  ).run(userId, now);

  return getKillaStats(userId);
}

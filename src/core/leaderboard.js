import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_LEADERBOARD_PATH = path.join(__dirname, "..", "..", "data", "leaderboard.json");

/**
 * Validates a player name:
 * 3-12 characters [A-Za-z0-9_], supporting accented Vietnamese letters as a bonus.
 */
export function validatePlayerName(name) {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 12) return false;
  const regex = /^[\p{L}\p{N}_]{3,12}$/u;
  return regex.test(trimmed);
}

/**
 * Loads leaderboard entries from JSON file.
 * Returns { entries: [...] }
 */
export function loadLeaderboard(filePath = DEFAULT_LEADERBOARD_PATH) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.entries)) {
        return sortAndSliceLeaderboard(data.entries);
      }
    }
  } catch (err) {
    // If corrupt or missing, start fresh
  }
  return { entries: [] };
}

/**
 * Sorts entries by score descending; ties broken by achieved_at ascending.
 * Limits to top 10.
 */
export function sortAndSliceLeaderboard(entries) {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const timeA = new Date(a.achieved_at).getTime() || 0;
    const timeB = new Date(b.achieved_at).getTime() || 0;
    return timeA - timeB;
  });
  return { entries: sorted.slice(0, 10) };
}

/**
 * Saves leaderboard to disk.
 */
export function saveLeaderboard(leaderboardData, filePath = DEFAULT_LEADERBOARD_PATH) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const cleanData = sortAndSliceLeaderboard(leaderboardData.entries || []);
  fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), "utf-8");
  return cleanData;
}

/**
 * Adds a new entry to the leaderboard.
 */
export function addLeaderboardEntry(entry, filePath = DEFAULT_LEADERBOARD_PATH) {
  if (!validatePlayerName(entry.name)) {
    throw new Error("Invalid player name: must be 3-12 characters [A-Za-z0-9_] or accented letters.");
  }

  const current = loadLeaderboard(filePath);
  const newEntry = {
    name: entry.name.trim(),
    score: Math.max(0, Math.floor(entry.score || 0)),
    nights_won: Math.min(3, Math.max(0, Math.floor(entry.nights_won || 0))),
    achieved_at: entry.achieved_at || new Date().toISOString(),
    seed: entry.seed !== undefined ? entry.seed : 42
  };

  current.entries.push(newEntry);
  return saveLeaderboard(current, filePath);
}

/**
 * Exports leaderboard to target output path.
 */
export function exportLeaderboard(targetPath, sourcePath = DEFAULT_LEADERBOARD_PATH) {
  const data = loadLeaderboard(sourcePath);
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf-8");
  return data;
}

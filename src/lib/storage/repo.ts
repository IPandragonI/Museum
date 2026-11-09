import { getDb } from "./db";
import { emptyDailyRecord, isDailyComplete } from "@/lib/game/daily";
import type { CollectionEntry, DailyRecord, GameMode, GameSession, QuestionResult } from "@/lib/types";

// ------------------------------------------------------------------ sessions

export async function saveSession(session: GameSession): Promise<void> {
  const db = await getDb();
  await db.put("sessions", session);
}

export async function listSessions(): Promise<GameSession[]> {
  const db = await getDb();
  return db.getAll("sessions");
}

// ---------------------------------------------------------------- collection

export async function listCollection(): Promise<CollectionEntry[]> {
  const db = await getDb();
  return db.getAll("collection");
}

/** Adds artworks to the collection, ignoring ones already present. Returns the ids that are new. */
export async function addToCollection(artworkIds: string[], mode: GameMode, sessionId: string): Promise<string[]> {
  if (!artworkIds.length) return [];
  const db = await getDb();
  const tx = db.transaction("collection", "readwrite");
  const added: string[] = [];
  for (const artworkId of new Set(artworkIds)) {
    if (await tx.store.get(artworkId)) continue;
    await tx.store.put({ artworkId, discoveredAt: new Date().toISOString(), mode, sessionId });
    added.push(artworkId);
  }
  await tx.done;
  return added;
}

// --------------------------------------------------------------------- daily

export async function getDaily(date: string): Promise<DailyRecord> {
  const db = await getDb();
  return (await db.get("daily", date)) ?? emptyDailyRecord(date);
}

export async function listDailyRecords(): Promise<DailyRecord[]> {
  const db = await getDb();
  return db.getAll("daily");
}

async function mutateDaily(date: string, fn: (r: DailyRecord) => void): Promise<DailyRecord> {
  const db = await getDb();
  const tx = db.transaction("daily", "readwrite");
  const rec = (await tx.store.get(date)) ?? emptyDailyRecord(date);
  fn(rec);
  await tx.store.put(rec);
  await tx.done;
  return rec;
}

/** Persist partial progress of a daily mode (answers so far and, for "guess", whether the hint is open). */
export function saveDailyProgress(date: string, mode: GameMode, answers: QuestionResult[], hint?: boolean): Promise<DailyRecord> {
  return mutateDaily(date, (r) => {
    const m = r.modes[mode];
    if (m.status === "completed") return; // completed modes are immutable
    m.status = "in_progress";
    m.answers = answers;
    m.hint = hint;
    m.stage = undefined; // legacy field from the removed reveal grid
  });
}

export function completeDailyMode(date: string, mode: GameMode, answers: QuestionResult[], sessionId: string): Promise<DailyRecord> {
  return mutateDaily(date, (r) => {
    const m = r.modes[mode];
    if (m.status === "completed") return;
    m.status = "completed";
    m.answers = answers;
    m.hint = undefined;
    m.stage = undefined;
    m.sessionId = sessionId;
    m.completedAt = new Date().toISOString();
    if (isDailyComplete(r) && !r.completedAt) r.completedAt = new Date().toISOString();
  });
}

// ------------------------------------------------------------------------ kv

const RECENT_LIMIT = 60;

export async function getRecent(mode: GameMode): Promise<string[]> {
  const db = await getDb();
  return ((await db.get("kv", "recent:" + mode)) as string[] | undefined) ?? [];
}

export async function pushRecent(mode: GameMode, ids: string[]): Promise<void> {
  const db = await getDb();
  const prev = ((await db.get("kv", "recent:" + mode)) as string[] | undefined) ?? [];
  const next = [...ids, ...prev.filter((i) => !ids.includes(i))].slice(0, RECENT_LIMIT);
  await db.put("kv", next, "recent:" + mode);
}

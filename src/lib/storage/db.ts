import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CollectionEntry, DailyRecord, GameSession } from "@/lib/types";

interface MuseumDB extends DBSchema {
  sessions: { key: string; value: GameSession; indexes: { "by-completed": string } };
  collection: { key: string; value: CollectionEntry };
  daily: { key: string; value: DailyRecord };
  kv: { key: string; value: unknown };
}

const DB_NAME = "museum";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MuseumDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<MuseumDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MuseumDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessions = db.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("by-completed", "completedAt");
        db.createObjectStore("collection", { keyPath: "artworkId" });
        db.createObjectStore("daily", { keyPath: "date" });
        db.createObjectStore("kv");
      },
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["sessions", "collection", "daily", "kv"], "readwrite");
  await Promise.all([tx.objectStore("sessions").clear(), tx.objectStore("collection").clear(), tx.objectStore("daily").clear(), tx.objectStore("kv").clear(), tx.done]);
  try {
    localStorage.removeItem("museum:rules-seen");
  } catch {
    /* ignore */
  }
}

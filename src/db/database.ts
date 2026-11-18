import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { SEED } from "./seed";

const KEY = "sqlite_db_arcade"; // la base viaja en Base64 dentro de localStorage

const SCHEMA = `
CREATE TABLE IF NOT EXISTS phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL UNIQUE COLLATE NOCASE,
  es TEXT,
  character TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cine','juego')),
  hero TEXT,
  card TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS my_votes (phrase_id INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  msg TEXT NOT NULL,
  at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

function toBase64(data: Uint8Array): string {
  let s = "";
  for (let i = 0; i < data.length; i += 0x8000) s += String.fromCharCode(...data.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export class DatabaseService {
  private static db: Database | null = null;
  private static SQL: Awaited<ReturnType<typeof initSqlJs>>;

  static async init(): Promise<Database> {
    if (this.db) return this.db;
    this.SQL = await initSqlJs({ locateFile: () => wasmUrl });
    let db: Database;
    try {
      const saved = localStorage.getItem(KEY);
      db = saved ? new this.SQL.Database(fromBase64(saved)) : new this.SQL.Database();
      db.run(SCHEMA);
    } catch {
      db = new this.SQL.Database(); // base corrupta: se crea una nueva en lugar de romper la app
      db.run(SCHEMA);
    }
    this.db = db;
    const n = db.exec("SELECT COUNT(*) FROM phrases")[0].values[0][0] as number;
    if (n === 0) this.seed();
    this.save();
    return db;
  }

  private static seed(): void {
    const db = this.db!;
    for (const s of SEED) {
      db.run(
        "INSERT INTO phrases (text, es, character, source, category, hero, card, votes) VALUES (?,?,?,?,?,?,?,?)",
        [s.text, s.es, s.character, s.source, s.category, `/img/${s.img}-hero.webp`, `/img/${s.img}-card.webp`, s.votes]
      );
    }
  }

  static save(): void {
    if (!this.db) return;
    try { localStorage.setItem(KEY, toBase64(this.db.export())); } catch { /* cuota llena */ }
  }

  static reset(): void {
    const db = this.db!;
    db.run("DELETE FROM my_votes");
    db.run("DELETE FROM activity");
    db.run("DELETE FROM phrases");
    db.run("DELETE FROM sqlite_sequence WHERE name='phrases'");
    this.seed();
    this.save();
  }
}

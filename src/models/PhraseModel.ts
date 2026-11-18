import type { Database, SqlValue } from "sql.js";

export type Category = "cine" | "juego";

export interface Phrase {
  id: number; text: string; es: string | null; character: string; source: string;
  category: Category; hero: string | null; card: string | null;
  votes: number; voted: boolean; createdAt: string;
}
export interface PhraseInput {
  text: string; character: string; source: string; category: Category;
  hero: string | null; card: string | null;
}
export interface ActivityItem { msg: string; at: string }

interface Hooks { save: () => void; reset: () => void }

/** CRUD de frases + votos. Todas las consultas son parametrizadas (?). */
export class PhraseModel {
  constructor(private db: Database, private hooks: Hooks) {}

  private rows<T>(sql: string, params: SqlValue[] = []): T[] {
    const st = this.db.prepare(sql);
    try {
      st.bind(params);
      const out: T[] = [];
      while (st.step()) out.push(st.getAsObject() as unknown as T);
      return out;
    } finally { st.free(); }
  }

  // READ
  all(): Phrase[] {
    const r = this.rows<Record<string, SqlValue>>(
      `SELECT p.*, EXISTS(SELECT 1 FROM my_votes v WHERE v.phrase_id = p.id) AS voted
       FROM phrases p ORDER BY p.votes DESC, p.id ASC`
    );
    return r.map((x) => ({
      id: x.id as number, text: x.text as string, es: (x.es as string) ?? null,
      character: x.character as string, source: x.source as string, category: x.category as Category,
      hero: (x.hero as string) ?? null, card: (x.card as string) ?? null,
      votes: x.votes as number, voted: x.voted === 1, createdAt: x.created_at as string,
    }));
  }

  // CREATE
  create(d: PhraseInput): number {
    this.db.run(
      "INSERT INTO phrases (text, character, source, category, hero, card, votes) VALUES (?,?,?,?,?,?,0)",
      [d.text, d.character, d.source, d.category, d.hero, d.card]
    );
    const id = this.db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    this.log(`Nueva frase agregada: “${this.short(d.text)}”`);
    return id;
  }

  // UPDATE
  update(id: number, d: PhraseInput): void {
    this.db.run(
      "UPDATE phrases SET text=?, es=NULL, character=?, source=?, category=?, hero=?, card=? WHERE id=?",
      [d.text, d.character, d.source, d.category, d.hero, d.card, id]
    );
    this.log(`Frase editada: “${this.short(d.text)}”`);
  }

  setTranslation(id: number, es: string): void {
    this.db.run("UPDATE phrases SET es=? WHERE id=?", [es, id]);
    this.hooks.save();
  }

  // DELETE
  remove(id: number): void {
    const t = this.rows<{ text: string }>("SELECT text FROM phrases WHERE id=?", [id])[0]?.text ?? "";
    this.db.run("DELETE FROM my_votes WHERE phrase_id=?", [id]);
    this.db.run("DELETE FROM phrases WHERE id=?", [id]);
    this.log(`Frase eliminada: “${this.short(t)}”`);
  }

  /** Vota o quita el voto. Devuelve true si quedó votada. */
  toggleVote(id: number): boolean {
    const had = this.rows("SELECT 1 FROM my_votes WHERE phrase_id=?", [id]).length > 0;
    if (had) {
      this.db.run("DELETE FROM my_votes WHERE phrase_id=?", [id]);
      this.db.run("UPDATE phrases SET votes = MAX(votes - 1, 0) WHERE id=?", [id]);
    } else {
      this.db.run("INSERT INTO my_votes (phrase_id) VALUES (?)", [id]);
      this.db.run("UPDATE phrases SET votes = votes + 1 WHERE id=?", [id]);
    }
    const t = this.rows<{ text: string }>("SELECT text FROM phrases WHERE id=?", [id])[0]?.text ?? "";
    this.log(`${had ? "Quitaste tu voto a" : "Votaste"} “${this.short(t)}”`);
    return !had;
  }

  recentActivity(n = 5): ActivityItem[] {
    return this.rows<ActivityItem>("SELECT msg, at FROM activity ORDER BY id DESC LIMIT ?", [n]);
  }

  reset(): void { this.hooks.reset(); }

  private short(t: string) { return t.length > 34 ? t.slice(0, 33) + "…" : t; }
  private log(msg: string): void {
    this.db.run("INSERT INTO activity (msg) VALUES (?)", [msg]);
    this.db.run("DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY id DESC LIMIT 30)");
    this.hooks.save();
  }
}

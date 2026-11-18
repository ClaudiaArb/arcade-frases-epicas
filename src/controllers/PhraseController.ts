import { PhraseModel } from "../models/PhraseModel";
import type { Phrase, PhraseInput, Category } from "../models/PhraseModel";
import { AppView, CATS } from "../views/AppView";
import type { Lang, CatFilter } from "../views/AppView";
import { translate, LANGS } from "../services/translate";

const URL_OK = /^(https?:\/\/|\/)[^\s'"()<>]+$/;

export class PhraseController {
  private cat: CatFilter = "all";
  private q = "";
  private lang: Lang = "orig";
  private heroIdx = 0;
  private openId: number | null = null;
  private flashId: number | null = null;
  private paused = false;
  private all: Phrase[] = [];

  constructor(private model: PhraseModel, private view: AppView) {}

  init(): void {
    this.view.mount();
    this.bind();
    this.refresh();
    window.setInterval(() => {
      const n = document.querySelectorAll(".slide").length;
      if (!this.paused && n > 1 && !document.body.classList.contains("lock")) this.goHero(this.heroIdx + 1);
    }, 7000);
  }

  // ---------- datos derivados ----------
  private byCat(): Phrase[] { return this.cat === "all" ? this.all : this.all.filter((p) => p.category === this.cat); }
  private heroList(): Phrase[] { return this.byCat().slice(0, 5); }
  private gallery(): Phrase[] {
    const q = this.q.trim().toLowerCase();
    return this.byCat()
      .filter((p) => !q || `${p.text} ${p.es ?? ""} ${p.character} ${p.source}`.toLowerCase().includes(q))
      .sort((a, b) => a.id - b.id);
  }
 
 
  private refresh(): void {
    this.all = this.model.all();
    const hero = this.heroList();
    if (this.heroIdx >= hero.length) this.heroIdx = 0;
    const title = this.cat === "all" ? "Más frases para ti" : `${CATS[this.cat].emoji} ${CATS[this.cat].label}`;
    this.view.renderNav(this.cat);
    this.view.renderTop(this.all.length, this.all.reduce((s, p) => s + p.votes, 0), this.lang);
    this.view.renderHero(hero, this.heroIdx, this.lang);
    this.view.renderRanking(this.byCat().slice(0, 10), this.lang, this.flashId);
    this.view.renderGallery(this.gallery(), this.lang, title);
    this.view.renderFeed(this.model.recentActivity(5));
    this.flashId = null;
    if (this.openId !== null) {
      const p = this.all.find((x) => x.id === this.openId);
      if (p) this.view.renderDetail(p, this.rankOf(p), this.lang);
    }
    if (this.lang === "es") void this.fillTranslations();
  }

  private rankOf(p: Phrase): number { return this.all.findIndex((x) => x.id === p.id) + 1; }

  private async fillTranslations(): Promise<void> {
    const missing = this.all.filter((p) => !p.es);
    if (!missing.length) return;
    let changed = false;
    for (const p of missing) {
      const t = await translate(p.text, "es");
      if (t) { this.model.setTranslation(p.id, t); changed = true; }
    }
    if (changed && this.lang === "es") { this.all = this.model.all(); this.refreshViewsOnly(); }
  }
  private refreshViewsOnly(): void {
    this.view.renderHero(this.heroList(), this.heroIdx, this.lang);
    this.view.renderRanking(this.byCat().slice(0, 10), this.lang, null);
    this.view.renderGallery(this.gallery(), this.lang, document.getElementById("gal-title")!.textContent ?? "");
  }

  private goHero(i: number): void {
    const n = this.heroList().length;
    if (!n) return;
    this.heroIdx = (i + n) % n;
    this.view.setHero(this.heroIdx);
  }

  // ---------- eventos ----------
  private bind(): void {
    const hero = document.getElementById("hero")!;
    hero.addEventListener("pointerenter", () => (this.paused = true));
    hero.addEventListener("pointerleave", () => (this.paused = false));

    document.addEventListener("input", (e) => {
      const t = e.target as HTMLElement;
      if (t.id === "search") { this.q = (t as HTMLInputElement).value; this.view.renderGallery(this.gallery(), this.lang, document.getElementById("gal-title")!.textContent ?? ""); }
    });

    document.addEventListener("submit", (e) => {
      const f = e.target as HTMLFormElement;
      if (f.id === "phrase-form") { e.preventDefault(); this.saveForm(f); }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("modal")!.hidden) this.close();
    });

    // Galería: arrastrar con el mouse/dedo sin disparar el clic de la tarjeta
    const g = document.getElementById("gallery")!;
    let down = false, sx = 0, sl = 0, moved = false;
    g.addEventListener("pointerdown", (e) => { if ((e as PointerEvent).pointerType === "mouse") { down = true; moved = false; sx = e.clientX; sl = g.scrollLeft; } });
    window.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; if (moved) g.scrollLeft = sl - dx; });
    window.addEventListener("pointerup", () => { down = false; window.setTimeout(() => (moved = false), 0); });

    document.addEventListener("click", (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
      if (!el) return;
      if (moved && el.dataset.action === "open") return;
      const id = Number(el.dataset.id);
      switch (el.dataset.action) {
        case "cat": this.cat = el.dataset.cat as CatFilter; this.heroIdx = 0; this.refresh(); break;
        case "lang": this.lang = el.dataset.lang as Lang; this.refresh(); break;
        case "hero-prev": this.goHero(this.heroIdx - 1); break;
        case "hero-next": this.goHero(this.heroIdx + 1); break;
        case "hero-dot": this.goHero(Number(el.dataset.i)); break;
        case "gal-prev": this.view.scrollGallery(-1); break;
        case "gal-next": this.view.scrollGallery(1); break;
        case "open": this.open(id, e.clientX, e.clientY); break;
        case "vote": this.vote(id); break;
        case "add": this.view.openForm(null); this.openId = null; break;
        case "edit": { const p = this.all.find((x) => x.id === id); if (p) { this.view.openForm(p); (document.getElementById("phrase-form") as HTMLFormElement).dataset.id = String(id); } break; }
        case "delete": this.remove(id); break;
        case "translate": void this.translateOpen(id); break;
        case "close": this.close(); break;
        case "reset": if (confirm("¿Restaurar las 12 frases originales? Se borrarán tus cambios y votos.")) { this.model.reset(); this.close(); this.refresh(); this.view.toast("Datos restaurados ✔"); } break;
      }
    });
  }

  private open(id: number, x: number, y: number): void {
    const p = this.all.find((v) => v.id === id);
    if (!p) return;
    this.openId = id;
    this.view.openDetail(p, this.rankOf(p), this.lang, x || innerWidth / 2, y || innerHeight / 2);
  }
  private close(): void { this.openId = null; this.view.closeModal(); }

  private vote(id: number): void {
    const now = this.model.toggleVote(id);
    this.flashId = id;
    this.refresh();
    this.view.toast(now ? "▲ +1 voto  🪙" : "Voto quitado");
  }

  private remove(id: number): void {
    const p = this.all.find((x) => x.id === id);
    if (!p || !confirm(`¿Eliminar esta frase?\n\n“${p.text}”`)) return;
    this.model.remove(id);
    this.close();
    this.refresh();
    this.view.toast("Frase eliminada 🗑");
  }

  private async translateOpen(id: number): Promise<void> {
    const p = this.all.find((x) => x.id === id);
    const sel = document.getElementById("tr-lang") as HTMLSelectElement;
    if (!p || !sel) return;
    const target = sel.value;
    this.view.setTranslation("Traduciendo...");
    const out = target === "es" && p.es ? p.es : await translate(p.text, target);
    if (!out) { this.view.setTranslation("No se pudo traducir ahora (revisa tu conexión)."); return; }
    this.view.setTranslation(`<small>${LANGS[target]}</small>“${out.replace(/[<>&]/g, "")}”`);
  }

  private saveForm(f: HTMLFormElement): void {
    const d = new FormData(f);
    const text = String(d.get("text") ?? "").trim().replace(/^[“"«']+|[”"»']+$/g, "").replace(/\s+/g, " ");
    const source = String(d.get("source") ?? "").trim();
    const image = String(d.get("image") ?? "").trim();
    const editId = f.dataset.id ? Number(f.dataset.id) : null;
    if (text.length < 4) return this.view.formError("La frase debe tener al menos 4 caracteres.");
    if (!source) return this.view.formError("Indica de qué juego, película o serie es.");
    if (image && !URL_OK.test(image)) return this.view.formError("La imagen debe ser una URL válida (http/https).");

    const prev = editId ? this.all.find((x) => x.id === editId) : null;
    const keep = prev && image === (prev.hero ?? "");
    const input: PhraseInput = {
      text, source, character: String(d.get("character") ?? "").trim(), category: d.get("category") as Category,
      hero: keep ? prev!.hero : image || null, card: keep ? prev!.card : image || null,
    };
    try {
      if (editId) this.model.update(editId, input); else this.model.create(input);
    } catch (err) {
      return this.view.formError(String(err).includes("UNIQUE") ? "Esa frase ya existe en el arcade." : "No se pudo guardar. Intenta de nuevo.");
    }
    this.view.closeModal();
    this.openId = null;
    this.refresh();
        if (!editId) document.getElementById("gallery")!.scrollTo({ left: 99999, behavior: "smooth" });
  }
}

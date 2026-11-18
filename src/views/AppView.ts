import type { Phrase, Category, ActivityItem } from "../models/PhraseModel";
import { LANGS } from "../services/translate";

export type Lang = "orig" | "es";
export type CatFilter = Category | "all";

export const CATS: Record<Category, { label: string; emoji: string }> = {
  cine: { label: "Películas y Series", emoji: "🎬" },
  juego: { label: "Videojuegos", emoji: "🎮" },
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const txt = (p: Phrase, l: Lang) => (l === "es" && p.es ? p.es : p.text);
const img = (p: Phrase, k: "hero" | "card") => (k === "hero" ? p.hero ?? p.card : p.card ?? p.hero);
const cover = (p: Phrase, k: "hero" | "card") => {
  const u = img(p, k);
  return `<div class="cover cat-${p.category}" ${u ? `style="background-image:url('${esc(u)}')"` : ""}></div>`;
};
const ago = (s: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(s.replace(" ", "T") + "Z").getTime()) / 60000));
  return m < 1 ? "ahora" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};

export class AppView {
  constructor(private root: HTMLElement) {}
  private $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  mount(): void {
    this.root.innerHTML = `
<div class="shell">
  <aside class="side">
    <div class="logo"><span class="logo-badge">Q</span><div class="logo-t"><b>QUOTE</b><b>ARCADE</b></div></div>
    <nav class="nav" id="nav"></nav>
    <div class="side-feed"><h4>Actividad reciente</h4><ul id="feed"></ul></div>
    <button class="reset" data-action="reset" title="Restaurar las 12 frases originales">⟲ <span>Restaurar datos</span></button>
  </aside>
  <main class="main">
    <header class="top">
      <label class="search"><span>🔎</span><input id="search" type="search" placeholder="Buscar frase, personaje o juego..." autocomplete="off" /></label>
      <div class="lang" id="lang" role="group" aria-label="Idioma de las frases"></div>
      <div class="chip coins" id="coins"></div>
      <button class="btn primary add-top" data-action="add">＋ <span>Agregar frase</span></button>
    </header>
    <section class="stage">
      <div class="hero" id="hero"></div>
      <aside class="panel rank" id="ranking"></aside>
    </section>
    <section class="gal-sec">
      <div class="gal-head"><div><h3 id="gal-title">Más frases para ti</h3><p class="gal-hint">✨ Las frases nuevas se agregan al final de la fila →</p></div>
        <div class="arrows"><button data-action="gal-prev" aria-label="Anterior">‹</button><button class="hot" data-action="gal-next" aria-label="Siguiente">›</button></div>
      </div>
      <div class="gallery" id="gallery"></div>
    </section>
  </main>
</div>
<div class="modal" id="modal" hidden></div>
<div class="toast" id="toast" role="status"></div>`;
  }

  renderNav(cat: CatFilter): void {
    const b = (c: CatFilter, e: string, l: string) =>
      `<button class="nav-btn ${cat === c ? "on" : ""}" data-action="cat" data-cat="${c}"><i>${e}</i><span>${l}</span></button>`;
    this.$("nav").innerHTML =
      b("all", "🏠", "Inicio") + b("cine", "🎬", "Películas y Series") + b("juego", "🎮", "Videojuegos") +
      `<button class="nav-btn add" data-action="add"><i>＋</i><span>Agregar frase</span></button>`;
  }

  renderTop(total: number, votes: number, lang: Lang): void {
    this.$("coins").innerHTML = `🪙 <b>${votes}</b> votos · <b>${total}</b> frases`;
    this.$("lang").innerHTML =
      `<button class="${lang === "orig" ? "on" : ""}" data-action="lang" data-lang="orig">Original</button>` +
      `<button class="${lang === "es" ? "on" : ""}" data-action="lang" data-lang="es">🌐 Español</button>`;
  }

  renderHero(list: Phrase[], idx: number, lang: Lang): void {
    if (!list.length) { this.$("hero").innerHTML = `<div class="empty">Aún no hay frases. ¡Agrega la primera!</div>`; return; }
    this.$("hero").innerHTML =
      list.map((p, i) => `
      <div class="slide ${i === idx ? "on" : ""}" data-action="open" data-id="${p.id}">
        ${cover(p, "hero")}<div class="shade"></div>
        <div class="slide-text">
          <span class="badge">🔥 Destacada #${i + 1}</span>
          <h2>“${esc(txt(p, lang))}”</h2>
          <p class="by">— ${esc(p.character || "Anónimo")} · <em>${esc(p.source)}</em></p>
          <div class="btns">
            <button class="btn primary ${p.voted ? "voted" : ""}" data-action="vote" data-id="${p.id}">▲ ${p.voted ? "Votada" : "Votar"} · ${p.votes}</button>
            <button class="btn ghost" data-action="open" data-id="${p.id}">Ver detalle ⤢</button>
          </div>
        </div>
      </div>`).join("") +
      `<div class="hero-nav"><button data-action="hero-prev" aria-label="Anterior">‹</button><button data-action="hero-next" aria-label="Siguiente">›</button><span id="hero-count">${idx + 1}/${list.length}</span></div>
       <div class="dots">${list.map((_, i) => `<button class="${i === idx ? "on" : ""}" data-action="hero-dot" data-i="${i}" aria-label="Frase ${i + 1}"></button>`).join("")}</div>`;
  }

  setHero(idx: number): void {
    document.querySelectorAll(".slide").forEach((e, i) => e.classList.toggle("on", i === idx));
    document.querySelectorAll(".dots button").forEach((e, i) => e.classList.toggle("on", i === idx));
    const c = document.getElementById("hero-count");
    if (c) c.textContent = `${idx + 1}/${document.querySelectorAll(".slide").length}`;
  }

  renderRanking(top: Phrase[], lang: Lang, flashId: number | null): void {
    this.$("ranking").innerHTML = `<div class="rank-h"><h3>🏆 Top 10</h3><span class="live"><i></i>en vivo</span></div>
    <ol>${top.length ? top.map((p, i) => `
      <li class="rank-item ${p.id === flashId ? "flash" : ""}" data-action="open" data-id="${p.id}">
        <span class="pos p${i + 1}">${i + 1}</span>
        <div class="thumb">${cover(p, "card")}</div>
        <div class="rank-t"><p>${esc(txt(p, lang))}</p><small>${CATS[p.category].emoji} ${esc(p.source)}</small></div>
        <button class="vbtn ${p.voted ? "voted" : ""}" data-action="vote" data-id="${p.id}" aria-label="Votar"><b>▲</b><span>${p.votes}</span></button>
      </li>`).join("") : `<li class="empty">Sin frases todavía</li>`}</ol>`;
  }

  renderGallery(list: Phrase[], lang: Lang, title: string): void {
    const g = this.$("gallery"), left = g.scrollLeft;
    this.$("gal-title").textContent = title;
    g.innerHTML = list.length ? list.map((p) => `
      <article class="card" data-action="open" data-id="${p.id}" tabindex="0">
        ${cover(p, "card")}<div class="card-shade"></div>
        <span class="votes">${p.id > 12 ? "✨ Nueva · " : ""}🪙 ${p.votes}</span>
        <div class="card-t">
          <p>“${esc(txt(p, lang))}”</p>
          <small>${esc(p.character || "Anónimo")}</small>
          <div class="tags"><span>${CATS[p.category].emoji} ${CATS[p.category].label}</span><span>${esc(p.source)}</span></div>
        </div>
        <button class="vbtn mini ${p.voted ? "voted" : ""}" data-action="vote" data-id="${p.id}" aria-label="Votar">▲</button>
      </article>`).join("") : `<div class="empty">No encontré frases con ese filtro.</div>`;
    g.scrollLeft = left;
  }

  renderFeed(items: ActivityItem[]): void {
    this.$("feed").innerHTML = items.length
      ? items.map((a) => `<li><span>${esc(a.msg)}</span><small>${ago(a.at)}</small></li>`).join("")
      : `<li><span>Vota una frase para empezar 🎮</span></li>`;
  }

  scrollGallery(dir: 1 | -1): void {
    this.$("gallery").scrollBy({ left: dir * Math.min(720, this.$("gallery").clientWidth * 0.8), behavior: "smooth" });
  }

  // ---------- Modal de detalle (se expande desde donde hiciste clic) ----------
  openDetail(p: Phrase, rank: number, lang: Lang, ox: number, oy: number): void {
    const m = this.$("modal");
    m.hidden = false;
    m.innerHTML = `<div class="modal-bg" data-action="close"></div><article class="detail" id="detail"></article>`;
    this.renderDetail(p, rank, lang);
    const d = this.$("detail"), r = d.getBoundingClientRect();
    d.style.transformOrigin = `${ox - r.left}px ${oy - r.top}px`;
    requestAnimationFrame(() => m.classList.add("open"));
    document.body.classList.add("lock");
  }

  renderDetail(p: Phrase, rank: number, lang: Lang): void {
    const bg = img(p, "hero");
    const poster = img(p, "card");
    this.$("detail").innerHTML = `
      <div class="detail-bg cat-${p.category}" ${bg ? `style="background-image:url('${esc(bg)}')"` : ""}></div>
      <div class="detail-shade"></div>
      <button class="x" data-action="close" aria-label="Cerrar">✕</button>
      <div class="detail-body">
        <div class="detail-main">
          <span class="chip">${CATS[p.category].emoji} ${CATS[p.category].label}</span>
          <blockquote>“${esc(txt(p, lang))}”</blockquote>
          <p class="by">— ${esc(p.character || "Anónimo")} · <em>${esc(p.source)}</em></p>
          <div class="detail-row">
            <button class="btn primary big ${p.voted ? "voted" : ""}" data-action="vote" data-id="${p.id}">▲ ${p.voted ? "Votada" : "Votar"}</button>
            <div class="stat"><b>${p.votes}</b><small>votos</small></div>
            <div class="stat"><b>#${rank}</b><small>ranking</small></div>
          </div>
          <div class="tr">
            <select id="tr-lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
            <button class="btn ghost" data-action="translate" data-id="${p.id}">🌐 Traducir</button>
            <p id="tr-out" aria-live="polite"></p>
          </div>
          <div class="detail-actions">
            <button class="btn ghost" data-action="edit" data-id="${p.id}">✏️ Editar</button>
            <button class="btn danger" data-action="delete" data-id="${p.id}">🗑 Eliminar</button>
          </div>
        </div>
        ${poster ? `<div class="detail-poster">${cover(p, "card")}</div>` : ""}
      </div>`;
  }

  setTranslation(html: string): void { const o = document.getElementById("tr-out"); if (o) o.innerHTML = html; }

  // ---------- Formulario crear / editar ----------
  openForm(p: Phrase | null): void {
    const m = this.$("modal");
    m.hidden = false;
    m.innerHTML = `<div class="modal-bg" data-action="close"></div>
    <form class="formbox" id="phrase-form" novalidate>
      <h3>${p ? "✏️ Editar frase" : "➕ Nueva frase"}</h3>
      <label>Categoría
        <select name="category">${(Object.keys(CATS) as Category[]).map((c) => `<option value="${c}" ${p?.category === c ? "selected" : ""}>${CATS[c].emoji} ${CATS[c].label}</option>`).join("")}</select>
      </label>
      <label>Frase <textarea name="text" maxlength="200" rows="3" placeholder="Escribe la frase épica...">${esc(p?.text ?? "")}</textarea></label>
      <div class="two">
        <label>Personaje <input name="character" maxlength="40" value="${esc(p?.character ?? "")}" placeholder="Ej. Kratos" /></label>
        <label>Juego / película / serie <input name="source" maxlength="60" value="${esc(p?.source ?? "")}" placeholder="Ej. God of War" /></label>
      </div>
      <label>Imagen (URL, opcional) <input name="image" value="${esc(p?.hero ?? "")}" placeholder="https://... (si no pones, uso una portada arcade)" /></label>
      <p class="err" id="form-err" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost" data-action="close">Cancelar</button><button class="btn primary" type="submit">${p ? "Guardar cambios" : "Publicar frase"}</button></div>
    </form>`;
    requestAnimationFrame(() => m.classList.add("open"));
    document.body.classList.add("lock");
    (m.querySelector("textarea") as HTMLElement).focus();
  }

  formError(msg: string): void { this.$("form-err").textContent = msg; }

  closeModal(): void {
    const m = this.$("modal");
    m.classList.remove("open");
    document.body.classList.remove("lock");
    window.setTimeout(() => { if (!m.classList.contains("open")) { m.hidden = true; m.innerHTML = ""; } }, 260);
  }

  toast(msg: string): void {
    const t = this.$("toast");
    t.textContent = msg; t.classList.add("show");
    window.clearTimeout((t as any)._t);
    (t as any)._t = window.setTimeout(() => t.classList.remove("show"), 2200);
  }
}

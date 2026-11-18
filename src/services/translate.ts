export const LANGS: Record<string, string> = {
  es: "Español", en: "English", pt: "Português", fr: "Français", it: "Italiano", de: "Deutsch",
};

const cache = new Map<string, string>();

/** Traduce con la API pública de MyMemory (sin clave). Devuelve null si falla. */
export async function translate(text: string, target: string): Promise<string | null> {
  const key = `${target}|${text}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${target}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const out: string | undefined = data?.responseData?.translatedText;
    if (!out || data.responseStatus !== 200) return null;
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}

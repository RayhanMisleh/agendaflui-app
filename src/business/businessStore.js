import { normalizeSlug } from "./storeLink";

const KEY = "agendaflui.business";
const MODE_KEY = "agendaflui.mode";
const MODES = ["customer", "staff"];

// A loja escolhida e o cache dos dados públicos dela (AsyncStorage: nada aqui é segredo).
export function createBusinessStore(storage) {
  async function read() {
    try {
      const raw = await storage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : null;
      // O slug guardado volta revalidado: o que não tem o formato de código de loja é descartado.
      const slug = saved ? normalizeSlug(saved.slug) : null;
      if (slug && slug === saved.slug) return { slug, business: saved.business || null };
    } catch (error) {
      // JSON estragado: tratado como vazio
    }
    return { slug: null, business: null };
  }

  return {
    async getSlug() {
      return (await read()).slug;
    },
    async setSlug(slug) {
      const saved = await read();
      await storage.setItem(KEY, JSON.stringify({ slug, business: saved.slug === slug ? saved.business : null }));
    },
    async getCached() {
      const saved = await read();
      if (!saved.business || saved.business.slug !== saved.slug) return null;
      return saved.business;
    },
    async setCached(business) {
      const saved = await read();
      if (!saved.slug) return;
      await storage.setItem(KEY, JSON.stringify({ slug: saved.slug, business }));
    },
    // 'customer' | 'staff' | null: um modo por vez no aparelho.
    async getMode() {
      try {
        const mode = await storage.getItem(MODE_KEY);
        return MODES.includes(mode) ? mode : null;
      } catch (error) {
        return null;
      }
    },
    async setMode(mode) {
      if (!MODES.includes(mode)) throw new Error("Modo inválido.");
      await storage.setItem(MODE_KEY, mode);
    },
    async clear() {
      for (const key of [KEY, MODE_KEY]) {
        try {
          await storage.removeItem(key);
        } catch (error) {
          // nada a fazer
        }
      }
    },
  };
}

const KEY = "agendaflui.business";

// A loja escolhida e o cache dos dados públicos dela (AsyncStorage: nada aqui é segredo).
export function createBusinessStore(storage) {
  async function read() {
    try {
      const raw = await storage.getItem(KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && typeof saved.slug === "string") return { slug: saved.slug, business: saved.business || null };
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
    async clear() {
      try {
        await storage.removeItem(KEY);
      } catch (error) {
        // nada a fazer
      }
    },
  };
}

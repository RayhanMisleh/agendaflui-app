const KEY = "agendaflui.session";
const FIELDS = ["accessToken", "accessExpiresAt", "refreshToken", "refreshExpiresAt"];

function pick(source) {
  const tokens = {};
  for (const field of FIELDS) tokens[field] = source[field];
  return tokens;
}

function isTokens(value) {
  return Boolean(value) && typeof value.accessToken === "string" && typeof value.refreshToken === "string";
}

// Tokens no armazenamento seguro, num único JSON com a loja a que pertencem. Os tokens só valem para essa loja.
export function createTokenStore(storage) {
  async function clear() {
    try {
      await storage.removeItem(KEY);
    } catch (error) {
      // sem como apagar agora: a próxima leitura confere a loja de novo
    }
  }

  return {
    async load(slug) {
      let saved;
      try {
        const raw = await storage.getItem(KEY);
        if (raw === null || raw === undefined) return null;
        saved = JSON.parse(raw);
      } catch (error) {
        await clear();
        return null;
      }
      if (!saved || saved.slug !== slug || !isTokens(saved)) {
        await clear();
        return null;
      }
      return pick(saved);
    },
    async save(slug, tokens) {
      await storage.setItem(KEY, JSON.stringify({ slug, ...pick(tokens) }));
    },
    clear,
  };
}

// Tokens da loja ativa: memória (consulta a cada requisição) e armazenamento seguro (sobrevive ao app fechado).
export function createSessionTokens(store, getSlug) {
  let memory = null;
  return {
    get: () => memory,
    async set(tokens) {
      memory = pick(tokens);
      const slug = getSlug();
      if (!slug) return;
      try {
        await store.save(slug, memory);
      } catch (error) {
        // sem gravar, a sessão vale até o app fechar
      }
    },
    async clear() {
      memory = null;
      await store.clear();
    },
    async load(slug) {
      memory = await store.load(slug);
      return memory;
    },
  };
}

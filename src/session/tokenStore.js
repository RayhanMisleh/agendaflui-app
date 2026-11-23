const DEFAULT_KEY = "agendaflui.session";
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
export function createTokenStore(storage, { key: KEY = DEFAULT_KEY } = {}) {
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
// A memória é presa à loja (`get` devolve null se a loja ativa mudou) e à sessão: `generation` muda a cada
// `set` e `clear`, e `setIf` só grava se a sessão ainda for a de quando a geração foi lida.
export function createSessionTokens(store, getSlug) {
  let memory = null; // { slug, tokens }
  let generation = 0;

  async function persist(tokens) {
    const slug = getSlug();
    if (!slug) return;
    try {
      await store.save(slug, tokens);
    } catch (error) {
      // sem gravar, a sessão vale até o app fechar
    }
  }

  async function set(tokens) {
    const kept = pick(tokens);
    memory = { slug: getSlug(), tokens: kept };
    generation += 1;
    await persist(kept);
  }

  // Grava para uma loja que ainda não é a ativa (a equipe entra antes de a loja ser escolhida).
  async function setFor(slug, tokens) {
    const kept = pick(tokens);
    memory = { slug, tokens: kept };
    generation += 1;
    try {
      await store.save(slug, kept);
    } catch (error) {
      // sem gravar, a sessão vale até o app fechar
    }
  }

  return {
    get: () => (memory && memory.slug === getSlug() ? memory.tokens : null),
    generation: () => generation,
    set,
    setFor,
    // Grava só se nada (sair, entrar, trocar de loja) aconteceu desde que `gen` foi lida. Devolve se gravou.
    async setIf(gen, tokens) {
      if (gen !== generation) return false;
      await set(tokens);
      return true;
    },
    async clear() {
      memory = null;
      generation += 1;
      await store.clear();
    },
    async load(slug) {
      const gen = generation;
      const loaded = await store.load(slug);
      // Algo mudou a sessão enquanto lia (sair, entrar): o que valia depois vence.
      if (gen !== generation) return memory && memory.slug === slug ? memory.tokens : null;
      memory = loaded ? { slug, tokens: loaded } : null;
      return loaded;
    },
  };
}

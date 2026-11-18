import { createApiClient } from "../../src/api/client";
import { fetchBusiness } from "../../src/api/business";
import { createBusinessStore } from "../../src/business/businessStore";
import { leaveBusiness } from "../../src/business/switching";
import { createTokenStore, createSessionTokens } from "../../src/session/tokenStore";
import { fakeAdapter } from "../helpers/fake-adapter";
import { memoryStorage } from "../helpers/memory-storage";

const T1 = {
  accessToken: "acc-1",
  accessExpiresAt: "2026-11-18T12:15:00.000Z",
  refreshToken: "ref-1",
  refreshExpiresAt: "2026-12-18T12:00:00.000Z",
};
const PATAS = { id: "b1", slug: "patas", name: "Patas e Pelos", brand: { logoUrl: null }, terms: {} };

function makeClient(handler, { slug = null } = {}) {
  const adapter = fakeAdapter(handler);
  const state = { slug };
  const storage = memoryStorage();
  const tokens = createSessionTokens(createTokenStore(storage), () => state.slug);
  const onBusinessGone = jest.fn();
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    appKey: "chave-de-teste",
    getSlug: () => state.slug,
    tokens,
    onSessionEnded: jest.fn(),
    onBusinessGone,
    adapter,
  });
  return { http: client.http, adapter, state, tokens, storage, onBusinessGone };
}

describe("fetchBusiness", () => {
  test("manda X-Business com o código digitado, mesmo sem loja escolhida, e devolve a conta", async () => {
    const { http, adapter } = makeClient(async () => ({ status: 200, data: PATAS }));
    await expect(fetchBusiness(http, "patas")).resolves.toEqual(PATAS);
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0].method).toBe("GET");
    expect(adapter.calls[0].url).toBe("/business");
    expect(adapter.calls[0].headers["x-business"]).toBe("patas");
    expect(adapter.calls[0].headers["x-app-key"]).toBe("chave-de-teste");
  });

  test("401 unknown_business vira a mensagem de código errado e não derruba a loja atual", async () => {
    const { http, onBusinessGone } = makeClient(
      async () => ({
        status: 401,
        data: { error: { code: "unauthorized", reason: "unknown_business", message: "Conta não encontrada." } },
      }),
      { slug: "patas" }
    );
    await expect(fetchBusiness(http, "inexistente")).rejects.toMatchObject({
      status: 401,
      reason: "unknown_business",
      message: "Não achamos essa loja. Confira o código.",
    });
    expect(onBusinessGone).not.toHaveBeenCalled();
  });

  test("503 da loja indisponível passa como está", async () => {
    const { http } = makeClient(async () => ({
      status: 503,
      data: { error: { code: "business_unavailable", reason: "business_unavailable", message: "Esta conta não está disponível agora." } },
    }));
    await expect(fetchBusiness(http, "patas")).rejects.toMatchObject({ status: 503, code: "business_unavailable" });
  });
});

describe("businessStore", () => {
  test("guarda a loja e o cache da conta, só na chave agendaflui.business", async () => {
    const storage = memoryStorage();
    const store = createBusinessStore(storage);
    expect(await store.getSlug()).toBeNull();
    await store.setSlug("patas");
    await store.setCached(PATAS);
    expect(await store.getSlug()).toBe("patas");
    expect(await store.getCached()).toEqual(PATAS);
    expect(Object.keys(storage.dump())).toEqual(["agendaflui.business"]);
  });

  test("trocar a loja descarta o cache da anterior", async () => {
    const store = createBusinessStore(memoryStorage());
    await store.setSlug("patas");
    await store.setCached(PATAS);
    await store.setSlug("outra");
    expect(await store.getSlug()).toBe("outra");
    expect(await store.getCached()).toBeNull();
  });

  test("cache de outra loja nunca é devolvido", async () => {
    const store = createBusinessStore(memoryStorage());
    await store.setSlug("outra");
    await store.setCached(PATAS);
    expect(await store.getCached()).toBeNull();
  });

  test("clear esquece tudo; JSON estragado vira vazio", async () => {
    const storage = memoryStorage();
    const store = createBusinessStore(storage);
    await store.setSlug("patas");
    await store.setCached(PATAS);
    await store.clear();
    expect(storage.dump()).toEqual({});
    const broken = createBusinessStore(memoryStorage({ "agendaflui.business": "{estragado" }));
    expect(await broken.getSlug()).toBeNull();
    expect(await broken.getCached()).toBeNull();
  });
});

describe("leaveBusiness (trocar ou perder a loja)", () => {
  async function loggedIn() {
    const c = makeClient(async () => ({ status: 204, data: undefined }), { slug: "patas" });
    await c.tokens.set(T1);
    const businessStorage = memoryStorage();
    const store = createBusinessStore(businessStorage);
    await store.setSlug("patas");
    await store.setCached(PATAS);
    return { ...c, store, businessStorage };
  }

  test("apaga tokens, cache e carrinho da loja anterior e revoga a sessão no servidor", async () => {
    const c = await loggedIn();
    const clearCart = jest.fn(async () => {});
    const clearPush = jest.fn(async () => {});
    await leaveBusiness({ http: c.http, slug: "patas", tokens: c.tokens, businessStore: c.store, clearCart, clearPush });

    expect(c.tokens.get()).toBeNull();
    expect(c.storage.dump()).toEqual({});
    expect(c.businessStorage.dump()).toEqual({});
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(clearPush).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const logout = c.adapter.calls.filter((call) => call.url === "/auth/customer/logout");
    expect(logout).toHaveLength(1);
    expect(logout[0].data).toEqual({ refreshToken: "ref-1" });
    expect(logout[0].headers["x-business"]).toBe("patas");
    expect(logout[0].headers.authorization).toBeUndefined();
  });

  test("não espera a revogação e ignora a falha dela", async () => {
    const c = makeClient(
      async () => {
        throw "network";
      },
      { slug: "patas" }
    );
    await c.tokens.set(T1);
    const store = createBusinessStore(memoryStorage());
    await store.setSlug("patas");
    await expect(
      leaveBusiness({ http: c.http, slug: "patas", tokens: c.tokens, businessStore: store, clearCart: async () => {} })
    ).resolves.toBeUndefined();
    expect(c.tokens.get()).toBeNull();
    expect(c.storage.dump()).toEqual({});
  });

  test("sem sessão, não chama o servidor", async () => {
    const c = makeClient(async () => ({ status: 204 }), { slug: "patas" });
    const store = createBusinessStore(memoryStorage());
    await leaveBusiness({ http: c.http, slug: "patas", tokens: c.tokens, businessStore: store, clearCart: async () => {} });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(c.adapter.calls).toHaveLength(0);
  });

  test("falha numa limpeza não impede as outras", async () => {
    const c = await loggedIn();
    const clearCart = jest.fn(async () => {
      throw new Error("carrinho travado");
    });
    await leaveBusiness({ http: c.http, slug: "patas", tokens: c.tokens, businessStore: c.store, clearCart });
    expect(c.tokens.get()).toBeNull();
    expect(c.storage.dump()).toEqual({});
    expect(c.businessStorage.dump()).toEqual({});
  });
});

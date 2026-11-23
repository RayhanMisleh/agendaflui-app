import { createApiClient } from "../../src/api/client";
import { createTokenStore, createSessionTokens } from "../../src/session/tokenStore";
import { createBusinessStore } from "../../src/business/businessStore";
import { fakeAdapter } from "../helpers/fake-adapter";
import { memoryStorage } from "../helpers/memory-storage";

const STAFF_KEY = "agendaflui.staffSession";
const T1 = { accessToken: "acc-1", accessExpiresAt: "2026-11-23T12:15:00.000Z", refreshToken: "ref-1", refreshExpiresAt: "2026-12-23T12:00:00.000Z" };
const T2 = { accessToken: "acc-2", accessExpiresAt: "2026-11-23T12:30:00.000Z", refreshToken: "ref-2", refreshExpiresAt: "2026-12-23T12:15:00.000Z" };
const CUSTOMER = { accessToken: "cli-1", accessExpiresAt: "2026-11-23T12:15:00.000Z", refreshToken: "cli-ref", refreshExpiresAt: "2026-12-23T12:00:00.000Z" };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errorBody = (code, reason) => ({ error: { code, reason, message: "Mensagem." } });

async function setup(handler, { slug = "patas", withTokens = true } = {}) {
  const storage = memoryStorage();
  const state = { slug };
  const tokens = createSessionTokens(createTokenStore(storage, { key: STAFF_KEY }), () => state.slug);
  if (withTokens) await tokens.set(T1);
  const adapter = fakeAdapter(handler);
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    getSlug: () => state.slug,
    tokens,
    authPrefix: "/auth/staff/",
    refreshPath: "/auth/staff/refresh",
    anonymousPaths: ["/availability", "/business"],
    noBusinessPaths: ["/auth/staff/login"],
    onSessionEnded: jest.fn(),
    onBusinessGone: jest.fn(),
    adapter,
  });
  return { http: client.http, adapter, tokens, storage, state };
}

describe("cliente da equipe", () => {
  test("login da equipe sai sem X-Business e sem Authorization, mesmo sem loja ativa", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }), { slug: null, withTokens: false });
    await http.post("/auth/staff/login", { email: "a@b.com", password: "x" });
    expect(adapter.calls[0].headers["x-business"]).toBeUndefined();
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
  });

  test("login da equipe também sai sem X-Business e sem token com loja e sessão ativas", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.post("/auth/staff/login", { email: "a@b.com", password: "x" });
    expect(adapter.calls[0].headers["x-business"]).toBeUndefined();
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
  });

  test("outra rota sem loja ativa continua recusada, sem rede", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }), { slug: null, withTokens: false });
    await expect(http.get("/staff/me")).rejects.toMatchObject({ code: "no_business" });
    expect(adapter.calls).toHaveLength(0);
  });

  test("rota da equipe leva o token da equipe e X-Business da loja ativa", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.get("/staff/me");
    expect(adapter.calls[0].headers["x-business"]).toBe("patas");
    expect(adapter.calls[0].headers.authorization).toBe("Bearer acc-1");
  });

  test("/availability e /business nunca levam o token da equipe", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.get("/availability", { params: { date: "2026-11-23" } });
    await http.get("/availability/days");
    await http.get("/business");
    await http.get("/availability?date=2026-11-23");
    expect(adapter.calls).toHaveLength(4);
    for (const call of adapter.calls) {
      expect(call.headers.authorization).toBeUndefined();
      expect(call.headers["x-business"]).toBe("patas");
    }
  });

  test("prefixo parecido não vira rota sem token", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.get("/businesses-x");
    expect(adapter.calls[0].headers.authorization).toBe("Bearer acc-1");
  });

  test("401 session_invalid na equipe renova por /auth/staff/refresh, uma vez só para duas requisições", async () => {
    const { http, adapter, tokens } = await setup(async (call) => {
      if (call.url === "/auth/staff/refresh") {
        await wait(15);
        return { status: 200, data: { tokens: T2 } };
      }
      if (call.headers.authorization === "Bearer acc-2") return { status: 200, data: { ok: call.url } };
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    const [a, b] = await Promise.all([http.get("/staff/me"), http.get("/staff/agenda")]);
    expect(a.data.ok).toBe("/staff/me");
    expect(b.data.ok).toBe("/staff/agenda");
    expect(adapter.calls.filter((c) => c.url === "/auth/staff/refresh")).toHaveLength(1);
    expect(adapter.calls.filter((c) => c.url === "/auth/customer/refresh")).toHaveLength(0);
    const refresh = adapter.calls.find((c) => c.url === "/auth/staff/refresh");
    expect(refresh.data).toEqual({ refreshToken: "ref-1" });
    expect(refresh.headers["x-business"]).toBe("patas");
    expect(refresh.headers.authorization).toBeUndefined();
    expect(tokens.get().accessToken).toBe("acc-2");
  });

  test("renovação recusada apaga a sessão da equipe e avisa", async () => {
    const storage = memoryStorage();
    const tokens = createSessionTokens(createTokenStore(storage, { key: STAFF_KEY }), () => "patas");
    await tokens.set(T1);
    const onSessionEnded = jest.fn();
    const adapter = fakeAdapter(async (call) =>
      call.url === "/auth/staff/refresh"
        ? { status: 401, data: errorBody("unauthorized", "session_invalid") }
        : { status: 401, data: errorBody("unauthorized", "session_invalid") }
    );
    const { http } = createApiClient({
      baseURL: "https://api.test/v1",
      getSlug: () => "patas",
      tokens,
      authPrefix: "/auth/staff/",
      refreshPath: "/auth/staff/refresh",
      anonymousPaths: ["/availability", "/business"],
      onSessionEnded,
      onBusinessGone: jest.fn(),
      adapter,
    });
    await expect(http.get("/staff/me")).rejects.toMatchObject({ reason: "session_ended" });
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
    expect(storage.dump()[STAFF_KEY]).toBeUndefined();
  });

  test("login recusado (invalid_credentials) não tenta renovar", async () => {
    const { http, adapter } = await setup(async () => ({ status: 401, data: errorBody("unauthorized", "invalid_credentials") }));
    await expect(http.post("/auth/staff/login", {})).rejects.toMatchObject({ status: 401 });
    expect(adapter.calls).toHaveLength(1);
  });
});

describe("cliente de clientes continua igual", () => {
  async function customerSetup(handler) {
    const tokens = createSessionTokens(createTokenStore(memoryStorage()), () => "patas");
    await tokens.set(CUSTOMER);
    const adapter = fakeAdapter(handler);
    const { http } = createApiClient({
      baseURL: "https://api.test/v1",
      getSlug: () => "patas",
      tokens,
      onSessionEnded: jest.fn(),
      onBusinessGone: jest.fn(),
      adapter,
    });
    return { http, adapter };
  }

  test("renova em /auth/customer/refresh", async () => {
    const { http, adapter } = await customerSetup(async (call) => {
      if (call.url === "/auth/customer/refresh") return { status: 200, data: { tokens: T2 } };
      if (call.headers.authorization === "Bearer acc-2") return { status: 200, data: {} };
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    await http.get("/me");
    expect(adapter.calls.map((c) => c.url)).toEqual(["/me", "/auth/customer/refresh", "/me"]);
  });

  test("token do cliente nunca vai para /staff/* nem para /auth/staff/*", async () => {
    const { http, adapter } = await customerSetup(async () => ({ status: 200, data: {} }));
    await http.get("/staff/me");
    await http.get("/staff/agenda");
    await http.post("/auth/staff/logout", {});
    for (const call of adapter.calls) expect(call.headers.authorization).toBeUndefined();
    await http.get("/me");
    expect(adapter.calls[3].headers.authorization).toBe("Bearer cli-1");
  });
});

describe("armazenamento separado", () => {
  test("tokens da equipe e do cliente ficam em chaves diferentes e não se apagam entre si", async () => {
    const storage = memoryStorage();
    const customer = createTokenStore(storage);
    const staff = createTokenStore(storage, { key: STAFF_KEY });
    await customer.save("patas", CUSTOMER);
    await staff.save("patas", T1);
    expect(Object.keys(storage.dump()).sort()).toEqual(["agendaflui.session", STAFF_KEY].sort());

    await staff.clear();
    expect((await customer.load("patas")).accessToken).toBe("cli-1");
    expect(await staff.load("patas")).toBeNull();

    await staff.save("patas", T1);
    await customer.clear();
    expect((await staff.load("patas")).accessToken).toBe("acc-1");
  });

  test("leitura de outra loja apaga só a chave da própria store", async () => {
    const storage = memoryStorage();
    const customer = createTokenStore(storage);
    const staff = createTokenStore(storage, { key: STAFF_KEY });
    await customer.save("patas", CUSTOMER);
    await staff.save("patas", T1);
    expect(await staff.load("outra")).toBeNull();
    expect((await customer.load("patas")).accessToken).toBe("cli-1");
  });

  test("setFor grava a sessão da equipe presa à loja informada, antes de ela ser a ativa", async () => {
    const storage = memoryStorage();
    const state = { slug: null };
    const tokens = createSessionTokens(createTokenStore(storage, { key: STAFF_KEY }), () => state.slug);
    await tokens.setFor("patas", T1);
    expect(tokens.get()).toBeNull();
    state.slug = "patas";
    expect(tokens.get().accessToken).toBe("acc-1");
    expect(JSON.parse(storage.dump()[STAFF_KEY]).slug).toBe("patas");
  });
});

describe("modo do aparelho", () => {
  test("modo guardado volta igual; clear apaga o modo", async () => {
    const store = createBusinessStore(memoryStorage());
    expect(await store.getMode()).toBeNull();
    await store.setMode("staff");
    expect(await store.getMode()).toBe("staff");
    await store.setMode("customer");
    expect(await store.getMode()).toBe("customer");
    await store.clear();
    expect(await store.getMode()).toBeNull();
  });

  test("valor desconhecido volta como nulo e setMode recusa o que não é modo", async () => {
    const storage = memoryStorage({ "agendaflui.mode": "admin" });
    const store = createBusinessStore(storage);
    expect(await store.getMode()).toBeNull();
    await expect(store.setMode("admin")).rejects.toThrow();
  });

  test("trocar a loja não muda o modo", async () => {
    const store = createBusinessStore(memoryStorage());
    await store.setSlug("patas");
    await store.setMode("staff");
    await store.setSlug("outra");
    expect(await store.getMode()).toBe("staff");
  });
});

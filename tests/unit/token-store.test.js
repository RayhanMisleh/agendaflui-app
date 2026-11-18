import { createTokenStore, createSessionTokens } from "../../src/session/tokenStore";
import { memoryStorage } from "../helpers/memory-storage";

const T = {
  accessToken: "acc-1",
  accessExpiresAt: "2026-11-18T12:15:00.000Z",
  refreshToken: "ref-1",
  refreshExpiresAt: "2026-12-18T12:00:00.000Z",
};

describe("tokenStore", () => {
  test("grava e lê os tokens da mesma loja", async () => {
    const store = createTokenStore(memoryStorage());
    await store.save("patas", T);
    expect(await store.load("patas")).toEqual(T);
  });

  test("tokens de outra loja não são entregues e o armazenamento é esvaziado", async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);
    await store.save("patas", T);
    expect(await store.load("outra")).toBeNull();
    expect(storage.dump()).toEqual({});
    expect(await store.load("patas")).toBeNull();
  });

  test("JSON estragado vira null e é apagado", async () => {
    const storage = memoryStorage({ "agendaflui.session": "{nao-e-json" });
    const store = createTokenStore(storage);
    expect(await store.load("patas")).toBeNull();
    expect(storage.dump()).toEqual({});
  });

  test("conteúdo sem os tokens vira null", async () => {
    const storage = memoryStorage({ "agendaflui.session": JSON.stringify({ slug: "patas" }) });
    const store = createTokenStore(storage);
    expect(await store.load("patas")).toBeNull();
    expect(storage.dump()).toEqual({});
  });

  test("clear apaga", async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);
    await store.save("patas", T);
    await store.clear();
    expect(storage.dump()).toEqual({});
    expect(await store.load("patas")).toBeNull();
  });

  test("só a chave agendaflui.session é usada, com um único JSON", async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);
    await store.save("patas", { ...T, extra: "não grava" });
    expect(Object.keys(storage.dump())).toEqual(["agendaflui.session"]);
    expect(JSON.parse(storage.dump()["agendaflui.session"])).toEqual({ slug: "patas", ...T });
  });

  test("falha do armazenamento na leitura vira null", async () => {
    const broken = {
      getItem: async () => {
        throw new Error("cofre indisponível");
      },
      setItem: async () => {},
      removeItem: async () => {},
    };
    expect(await createTokenStore(broken).load("patas")).toBeNull();
  });
});

describe("sessionTokens (memória + tokenStore)", () => {
  test("set grava na memória e no armazenamento sob a loja ativa", async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);
    const tokens = createSessionTokens(store, () => "patas");
    await tokens.set(T);
    expect(tokens.get()).toEqual(T);
    expect(await store.load("patas")).toEqual(T);
  });

  test("clear zera a memória e o armazenamento", async () => {
    const storage = memoryStorage();
    const tokens = createSessionTokens(createTokenStore(storage), () => "patas");
    await tokens.set(T);
    await tokens.clear();
    expect(tokens.get()).toBeNull();
    expect(storage.dump()).toEqual({});
  });

  test("load de outra loja deixa a memória vazia", async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);
    await store.save("patas", T);
    const tokens = createSessionTokens(store, () => "outra");
    expect(await tokens.load("outra")).toBeNull();
    expect(tokens.get()).toBeNull();
    expect(storage.dump()).toEqual({});
  });

  test("sem loja ativa os tokens ficam só na memória", async () => {
    const storage = memoryStorage();
    const tokens = createSessionTokens(createTokenStore(storage), () => null);
    await tokens.set(T);
    expect(tokens.get()).toEqual(T);
    expect(storage.dump()).toEqual({});
  });

  test("armazenamento que falha ao gravar não derruba a sessão em memória", async () => {
    const broken = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error("cofre indisponível");
      },
      removeItem: async () => {},
    };
    const tokens = createSessionTokens(createTokenStore(broken), () => "patas");
    await expect(tokens.set(T)).resolves.toBeUndefined();
    expect(tokens.get()).toEqual(T);
  });
});

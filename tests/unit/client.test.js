import { createApiClient } from "../../src/api/client";
import { ApiError, NETWORK_MESSAGE } from "../../src/api/errors";
import { createTokenStore, createSessionTokens } from "../../src/session/tokenStore";
import { fakeAdapter } from "../helpers/fake-adapter";
import { memoryStorage } from "../helpers/memory-storage";

const T1 = {
  accessToken: "acc-1",
  accessExpiresAt: "2026-11-18T12:15:00.000Z",
  refreshToken: "ref-1",
  refreshExpiresAt: "2026-12-18T12:00:00.000Z",
};
const T2 = {
  accessToken: "acc-2",
  accessExpiresAt: "2026-11-18T12:30:00.000Z",
  refreshToken: "ref-2",
  refreshExpiresAt: "2026-12-18T12:15:00.000Z",
};

const SESSION_ENDED = "Sua sessão venceu. Entre de novo.";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errorBody = (code, reason, message = "Mensagem do servidor.") => ({ error: { code, reason, message } });
const refreshCalls = (adapter) => adapter.calls.filter((c) => c.url === "/auth/customer/refresh");

// Monta o cliente com armazenamento em memória e adaptador falso. `state.slug` muda a loja ativa.
async function setup(handler, { slug = "patas", withTokens = true } = {}) {
  const storage = memoryStorage();
  const store = createTokenStore(storage);
  const state = { slug };
  const tokens = createSessionTokens(store, () => state.slug);
  if (withTokens) await tokens.set(T1);
  const adapter = fakeAdapter(handler);
  const onSessionEnded = jest.fn();
  const onBusinessGone = jest.fn();
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    appKey: "chave-de-teste",
    getSlug: () => state.slug,
    tokens,
    onSessionEnded,
    onBusinessGone,
    adapter,
  });
  return { client, http: client.http, adapter, tokens, store, storage, state, onSessionEnded, onBusinessGone };
}

// Rota /me aceita só o token novo; a renovação devolve T2 depois de um instante (dá tempo de as duas chamadas baterem).
function meHandler({ refreshDelay = 15, refreshResult } = {}) {
  return async (call) => {
    if (call.url === "/auth/customer/refresh") {
      await wait(refreshDelay);
      return refreshResult ? refreshResult(call) : { status: 200, data: { tokens: T2 } };
    }
    if (call.headers.authorization === "Bearer acc-2") return { status: 200, data: { ok: call.url } };
    return { status: 401, data: errorBody("unauthorized", "session_invalid") };
  };
}

describe("cabeçalhos", () => {
  test("X-App-Key, X-Business, Authorization e Content-Type em toda requisição", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.get("/me");
    const [call] = adapter.calls;
    expect(call.baseURL).toBe("https://api.test/v1");
    expect(call.headers["x-app-key"]).toBe("chave-de-teste");
    expect(call.headers["x-business"]).toBe("patas");
    expect(call.headers.authorization).toBe("Bearer acc-1");
    expect(call.headers["content-type"]).toMatch(/application\/json/);
  });

  test("rotas /auth/customer/* não levam Authorization, mas levam a loja e a chave", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.post("/auth/customer/login", { email: "a@b.c", password: "x" });
    const [call] = adapter.calls;
    expect(call.headers.authorization).toBeUndefined();
    expect(call.headers["x-business"]).toBe("patas");
    expect(call.headers["x-app-key"]).toBe("chave-de-teste");
  });

  test("sem tokens não há Authorization", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }), { withTokens: false });
    await http.get("/professionals");
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
  });

  test("sem loja escolhida a requisição rejeita e não vai à rede", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }), { slug: null });
    await expect(http.get("/professionals")).rejects.toBeInstanceOf(ApiError);
    expect(adapter.calls).toHaveLength(0);
  });

  test("X-Business explícito vale, mas o token da loja atual não vai junto", async () => {
    const { http, adapter } = await setup(async () => ({ status: 200, data: {} }));
    await http.get("/business", { headers: { "X-Business": "outra" } });
    expect(adapter.calls[0].headers["x-business"]).toBe("outra");
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
  });
});

describe("renovação do token", () => {
  test("duas requisições com 401 session_invalid fazem UMA renovação e as duas repetem com o token novo", async () => {
    const { http, adapter, store } = await setup(meHandler());
    const [a, b] = await Promise.all([http.get("/me"), http.get("/loyalty/me")]);

    expect(a.data).toEqual({ ok: "/me" });
    expect(b.data).toEqual({ ok: "/loyalty/me" });
    const refreshes = refreshCalls(adapter);
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0].method).toBe("POST");
    expect(refreshes[0].data).toEqual({ refreshToken: "ref-1" });
    expect(refreshes[0].headers.authorization).toBeUndefined();
    expect(refreshes[0].headers["x-business"]).toBe("patas");

    const sent = adapter.calls.filter((c) => c.url !== "/auth/customer/refresh");
    expect(sent).toHaveLength(4);
    expect(sent.filter((c) => c.headers.authorization === "Bearer acc-2")).toHaveLength(2);
    expect(await store.load("patas")).toEqual(T2);
  });

  test("três requisições simultâneas ainda renovam uma vez só", async () => {
    const { http, adapter } = await setup(meHandler());
    await Promise.all([http.get("/a"), http.get("/b"), http.get("/c")]);
    expect(refreshCalls(adapter)).toHaveLength(1);
  });

  test("o par novo já está gravado quando as repetições saem", async () => {
    const { http, tokens, adapter } = await setup(async (call) => {
      if (call.url === "/auth/customer/refresh") return { status: 200, data: { tokens: T2 } };
      if (call.headers.authorization === "Bearer acc-2") return { status: 200, data: {} };
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    await http.get("/me");
    expect(tokens.get()).toEqual(T2);
    expect(adapter.calls.at(-1).headers.authorization).toBe("Bearer acc-2");
  });

  test("renovação recusada: tokens apagados, onSessionEnded uma vez, original rejeita com a mensagem de sessão vencida", async () => {
    const { http, adapter, tokens, storage, onSessionEnded } = await setup(
      meHandler({
        refreshResult: () => ({ status: 401, data: errorBody("unauthorized", "invalid_refresh_token", "Qualquer texto do servidor.") }),
      })
    );
    const results = await Promise.allSettled([http.get("/me"), http.get("/loyalty/me")]);

    for (const r of results) {
      expect(r.status).toBe("rejected");
      expect(r.reason).toBeInstanceOf(ApiError);
      expect(r.reason.message).toBe(SESSION_ENDED);
    }
    expect(refreshCalls(adapter)).toHaveLength(1);
    expect(tokens.get()).toBeNull();
    expect(storage.dump()).toEqual({});
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  test("qualquer 4xx da renovação encerra a sessão", async () => {
    const { http, tokens, onSessionEnded } = await setup(
      meHandler({ refreshResult: () => ({ status: 400, data: errorBody("validation", undefined, "Dados inválidos.") }) })
    );
    await expect(http.get("/me")).rejects.toMatchObject({ message: SESSION_ENDED });
    expect(tokens.get()).toBeNull();
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  test("renovação sem rede: tokens mantidos e a mensagem é a de conexão", async () => {
    const { http, tokens, store, onSessionEnded } = await setup(
      meHandler({
        refreshResult: () => {
          throw "network";
        },
      })
    );
    await expect(http.get("/me")).rejects.toMatchObject({ message: NETWORK_MESSAGE });
    expect(tokens.get()).toEqual(T1);
    expect(await store.load("patas")).toEqual(T1);
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  test("erro do servidor (5xx) ou limite (429) na renovação não derruba a sessão", async () => {
    for (const status of [500, 503, 429]) {
      const { http, tokens, onSessionEnded } = await setup(
        meHandler({ refreshResult: () => ({ status, data: errorBody("internal", undefined, "Tente depois.") }) })
      );
      await expect(http.get("/me")).rejects.toMatchObject({ status });
      expect(tokens.get()).toEqual(T1);
      expect(onSessionEnded).not.toHaveBeenCalled();
    }
  });

  test("repetição que volta 401 de novo não renova outra vez", async () => {
    let sent = 0;
    const { http, adapter } = await setup(async (call) => {
      // teto de segurança: sem a regra de "uma repetição só", o laço pararia aqui em vez de travar o teste
      if (++sent > 8) return { status: 500, data: errorBody("internal", undefined, "Laço de renovação.") };
      if (call.url === "/auth/customer/refresh") return { status: 200, data: { tokens: T2 } };
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    await expect(http.get("/me")).rejects.toMatchObject({ status: 401, reason: "session_invalid" });
    expect(refreshCalls(adapter)).toHaveLength(1);
    expect(adapter.calls.filter((c) => c.url === "/me")).toHaveLength(2);
  });

  test("401 que chega depois de outra requisição já ter renovado repete sem renovar de novo", async () => {
    // O token enviado era o velho (acc-1), mas o par novo já está em uso: não gasta outro token de renovação.
    const state = {};
    const { http, adapter, tokens } = await setup(async (call) => {
      if (call.url === "/auth/customer/refresh") return { status: 200, data: { tokens: T2 } };
      if (call.headers.authorization === "Bearer acc-2") return { status: 200, data: { ok: true } };
      if (call.url === "/lenta") {
        await state.renewed;
        return { status: 401, data: errorBody("unauthorized", "session_invalid") };
      }
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    let release;
    state.renewed = new Promise((resolve) => {
      release = resolve;
    });
    const slow = http.get("/lenta");
    await http.get("/rapida");
    expect(tokens.get()).toEqual(T2);
    release();
    await expect(slow).resolves.toMatchObject({ data: { ok: true } });
    expect(refreshCalls(adapter)).toHaveLength(1);
  });

  test("troca de loja no meio da renovação: o par novo não é gravado e nada vaza para a outra loja", async () => {
    const holder = {};
    const { http, adapter, tokens, storage, state, onSessionEnded } = await setup(async (call) => {
      if (call.url === "/auth/customer/refresh") {
        await holder.switchStore();
        return { status: 200, data: { tokens: T2 } };
      }
      return { status: 401, data: errorBody("unauthorized", "session_invalid") };
    });
    holder.switchStore = async () => {
      state.slug = "outra";
      await tokens.clear();
    };
    await expect(http.get("/me")).rejects.toBeInstanceOf(ApiError);
    expect(tokens.get()).toBeNull();
    expect(storage.dump()).toEqual({});
    expect(adapter.calls.filter((c) => c.url === "/me")).toHaveLength(1);
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  test("sem Authorization na requisição, session_invalid só rejeita", async () => {
    const { http, adapter } = await setup(async () => ({ status: 401, data: errorBody("unauthorized", "session_invalid") }), {
      withTokens: false,
    });
    await expect(http.get("/professionals")).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls(adapter)).toHaveLength(0);
  });
});

describe("401 que nunca renova", () => {
  test("unknown_business chama onBusinessGone e não renova", async () => {
    const { http, adapter, onBusinessGone, onSessionEnded, tokens } = await setup(async () => ({
      status: 401,
      data: errorBody("unauthorized", "unknown_business", "Conta não encontrada."),
    }));
    await expect(http.get("/me")).rejects.toMatchObject({ status: 401, reason: "unknown_business" });
    expect(refreshCalls(adapter)).toHaveLength(0);
    expect(adapter.calls).toHaveLength(1);
    expect(onBusinessGone).toHaveBeenCalledTimes(1);
    expect(onSessionEnded).not.toHaveBeenCalled();
    expect(tokens.get()).toEqual(T1);
  });

  test("unknown_business de uma requisição de outra loja (conferir código) não dispara onBusinessGone", async () => {
    const { http, onBusinessGone } = await setup(async () => ({
      status: 401,
      data: errorBody("unauthorized", "unknown_business"),
    }));
    await expect(http.get("/business", { headers: { "X-Business": "inexistente" } })).rejects.toMatchObject({
      reason: "unknown_business",
    });
    expect(onBusinessGone).not.toHaveBeenCalled();
  });

  test("invalid_credentials no login não renova", async () => {
    const { http, adapter, onSessionEnded } = await setup(async () => ({
      status: 401,
      data: errorBody("unauthorized", "invalid_credentials", "E-mail ou senha incorretos."),
    }));
    await expect(http.post("/auth/customer/login", { email: "a@b.c", password: "x" })).rejects.toMatchObject({
      reason: "invalid_credentials",
      message: "E-mail ou senha incorretos.",
    });
    expect(refreshCalls(adapter)).toHaveLength(0);
    expect(adapter.calls).toHaveLength(1);
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  test("qualquer 401 de /auth/customer/* só rejeita, mesmo com reason session_invalid", async () => {
    const { http, adapter } = await setup(async () => ({ status: 401, data: errorBody("unauthorized", "session_invalid") }));
    await expect(http.post("/auth/customer/logout", { refreshToken: "ref-1" })).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls(adapter)).toHaveLength(0);
    expect(adapter.calls).toHaveLength(1);
  });

  test("invalid_app_key não renova", async () => {
    const { http, adapter, tokens } = await setup(async () => ({
      status: 401,
      data: errorBody("unauthorized", "invalid_app_key", "Chave do aplicativo inválida."),
    }));
    await expect(http.get("/me")).rejects.toMatchObject({ reason: "invalid_app_key" });
    expect(refreshCalls(adapter)).toHaveLength(0);
    expect(tokens.get()).toEqual(T1);
  });
});

describe("erros", () => {
  test("a requisição rejeita sempre com ApiError, com os campos do contrato", async () => {
    const { http } = await setup(async () => ({
      status: 409,
      data: { error: { code: "conflict", reason: "slot_taken", message: "Esse horário acabou de ser ocupado." } },
      headers: { "x-request-id": "req-9", "retry-after": "3" },
    }));
    const error = await http.post("/appointments", {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "conflict",
      reason: "slot_taken",
      message: "Esse horário acabou de ser ocupado.",
      requestId: "req-9",
      retryAfterSec: 3,
    });
  });

  test("sem rede e com tempo esgotado", async () => {
    const net = await setup(async () => {
      throw "network";
    });
    await expect(net.http.get("/professionals")).rejects.toMatchObject({ message: NETWORK_MESSAGE });
    const slow = await setup(async () => {
      throw "timeout";
    });
    await expect(slow.http.get("/professionals")).rejects.toMatchObject({ message: "A conexão demorou demais. Tente de novo." });
  });

  test("nenhuma chamada ao console, com sucesso, erro ou renovação", async () => {
    const spies = ["log", "info", "debug", "warn", "error"].map((name) => jest.spyOn(console, name).mockImplementation(() => {}));
    try {
      const { http } = await setup(meHandler());
      await http.get("/me");
      const failing = await setup(async () => ({ status: 500, data: errorBody("internal", undefined, "Falhou.") }));
      await failing.http.get("/me").catch(() => {});
      const offline = await setup(async () => {
        throw "network";
      });
      await offline.http.get("/me").catch(() => {});
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});

import { getMyLoyalty, listPrizes, redeemPrize, listRedemptions, cancelRedemption, getRanking } from "../../src/api/loyalty";
import { createIdempotencyKeys } from "../../src/api/idempotency";
import { isModuleDisabled } from "../../src/api/errors";

let mockHandler;

// O módulo usa o cliente único; aqui ele ganha um adaptador falso (nada sai do processo).
jest.mock("../../src/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter } = jest.requireActual("../helpers/fake-adapter");
  const adapter = fakeAdapter((call) => mockHandler(call));
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    appKey: "chave-de-teste",
    getSlug: () => "patas",
    tokens: { get: () => null, set: async () => {}, clear: async () => {} },
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { api: client, __adapter: adapter };
});

const adapter = require("../../src/api").__adapter;
const last = () => adapter.calls[adapter.calls.length - 1];

beforeEach(() => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 200, data: {} });
});

describe("leitura", () => {
  test("getMyLoyalty devolve saldo, clube e termos", async () => {
    const data = { balance: 120, clubMember: true, terms: { points: { singular: "pata", plural: "patas" }, club: "Clube Pet" } };
    mockHandler = async () => ({ status: 200, data });
    await expect(getMyLoyalty()).resolves.toEqual(data);
    expect(last().method).toBe("GET");
    expect(last().url).toBe("/loyalty/me");
  });

  test("listPrizes devolve items", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "p1" }] } });
    await expect(listPrizes()).resolves.toEqual([{ id: "p1" }]);
    expect(last().url).toBe("/loyalty/prizes");
  });

  test("listRedemptions manda o cursor só quando existe e devolve items e nextCursor", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "r1" }], nextCursor: "c2" } });
    await expect(listRedemptions({})).resolves.toEqual({ items: [{ id: "r1" }], nextCursor: "c2" });
    expect(last().url).toBe("/loyalty/redemptions");
    expect(last().params).toEqual({});
    await listRedemptions({ cursor: "c2" });
    expect(last().params).toEqual({ cursor: "c2" });
  });

  test("getRanking devolve enabled, mês e entradas", async () => {
    const data = { enabled: true, month: "2026-11", entries: [{ position: 1, firstName: "Ana", avatarUrl: null, points: 90 }] };
    mockHandler = async () => ({ status: 200, data });
    await expect(getRanking()).resolves.toEqual(data);
    expect(last().url).toBe("/loyalty/ranking");
  });

  test("404 module_disabled vira ApiError reconhecido por isModuleDisabled", async () => {
    mockHandler = async () => ({
      status: 404,
      data: { error: { code: "module_disabled", message: "Esse recurso não está ligado nesta conta." } },
    });
    const error = await getRanking().catch((e) => e);
    expect(error.status).toBe(404);
    expect(error.code).toBe("module_disabled");
    expect(isModuleDisabled(error)).toBe(true);
  });
});

describe("resgate", () => {
  test("redeemPrize manda a Idempotency-Key e só prizeId e expectedCostPoints", async () => {
    const data = { redemption: { id: "r1", status: "PENDING" }, balance: 20 };
    mockHandler = async () => ({ status: 201, data });
    await expect(redeemPrize({ prizeId: "p1", expectedCostPoints: 300 }, "k9")).resolves.toEqual(data);
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/loyalty/redemptions");
    expect(last().headers["idempotency-key"]).toBe("k9");
    expect(last().data).toEqual({ prizeId: "p1", expectedCostPoints: 300 });
  });

  test("falha de rede na primeira tentativa: a nova tentativa sai com a MESMA chave", async () => {
    let n = 0;
    const keys = createIdempotencyKeys(() => `chave-${++n}`);
    const signature = "prize:p1";
    let attempt = 0;
    mockHandler = async () => {
      attempt += 1;
      if (attempt === 1) throw "network";
      return { status: 201, data: { redemption: { id: "r1" }, balance: 0 } };
    };

    await expect(redeemPrize({ prizeId: "p1", expectedCostPoints: 300 }, keys.keyFor(signature))).rejects.toMatchObject({ message: expect.any(String) });
    await redeemPrize({ prizeId: "p1", expectedCostPoints: 300 }, keys.keyFor(signature));
    keys.done(signature);

    expect(adapter.calls).toHaveLength(2);
    expect(adapter.calls[0].headers["idempotency-key"]).toBe("chave-1");
    expect(adapter.calls[1].headers["idempotency-key"]).toBe("chave-1");

    // depois do sucesso, o próximo resgate do mesmo prêmio é outro pedido
    await redeemPrize({ prizeId: "p1", expectedCostPoints: 300 }, keys.keyFor(signature));
    expect(adapter.calls[2].headers["idempotency-key"]).toBe("chave-2");
  });

  test("409 insufficient_points chega com a mensagem do servidor", async () => {
    mockHandler = async () => ({
      status: 409,
      data: { error: { code: "conflict", reason: "insufficient_points", message: "Você não tem pontos suficientes." } },
    });
    const error = await redeemPrize({ prizeId: "p1", expectedCostPoints: 300 }, "k1").catch((e) => e);
    expect(error.reason).toBe("insufficient_points");
    expect(error.message).toBe("Você não tem pontos suficientes.");
  });

  test("cancelRedemption usa POST /loyalty/redemptions/r1/cancel e devolve o resgate", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "r1", status: "CANCELED" } });
    await expect(cancelRedemption("r1")).resolves.toEqual({ id: "r1", status: "CANCELED" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/loyalty/redemptions/r1/cancel");
  });
});

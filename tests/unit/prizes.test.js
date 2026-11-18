import { prizeState, redemptionStatusLabel, rewardPointsOf, missingPoints } from "../../src/loyalty/prizes";

describe("prizeState", () => {
  test("indisponível quando available é falso, mesmo com saldo de sobra", () => {
    expect(prizeState({ available: false, costPoints: 1 }, 99)).toBe("unavailable");
  });

  test("insuficiente quando o saldo é menor que o custo", () => {
    expect(prizeState({ available: true, costPoints: 300 }, 299)).toBe("insufficient");
  });

  test("disponível quando o saldo cobre o custo", () => {
    expect(prizeState({ available: true, costPoints: 300 }, 300)).toBe("available");
    expect(prizeState({ available: true, costPoints: 300 }, 301)).toBe("available");
  });

  test("sem saldo conhecido (visitante) conta como zero", () => {
    expect(prizeState({ available: true, costPoints: 300 }, null)).toBe("insufficient");
  });
});

describe("missingPoints", () => {
  test("quanto falta, nunca negativo", () => {
    expect(missingPoints({ costPoints: 300 }, 120)).toBe(180);
    expect(missingPoints({ costPoints: 300 }, 500)).toBe(0);
    expect(missingPoints({ costPoints: 300 }, undefined)).toBe(300);
  });
});

describe("redemptionStatusLabel", () => {
  test("rótulos das três situações", () => {
    expect(redemptionStatusLabel("PENDING")).toBe("Retire no balcão");
    expect(redemptionStatusLabel("DELIVERED")).toBe("Entregue");
    expect(redemptionStatusLabel("CANCELED")).toBe("Cancelado");
  });

  test("situação desconhecida devolve texto neutro", () => {
    expect(redemptionStatusLabel("OUTRA")).toBe("");
  });
});

describe("rewardPointsOf", () => {
  test("soma rewardPoints dos serviços, ignorando o que falta", () => {
    expect(rewardPointsOf([{ rewardPoints: 10 }, { rewardPoints: 5 }, {}, { rewardPoints: null }])).toBe(15);
    expect(rewardPointsOf([])).toBe(0);
    expect(rewardPointsOf(undefined)).toBe(0);
  });
});

import { createPrizeRedeemer, earnLabel } from "../../src/loyalty/prizes";
import { ApiError } from "../../src/api/errors";

describe("resgate: chave por intenção", () => {
  const prize = { id: "p1", costPoints: 300 };
  const counter = () => {
    let n = 0;
    return () => `chave-${++n}`;
  };

  test("dois resgates seguidos do mesmo prêmio, com sucesso no primeiro, mandam chaves diferentes", async () => {
    const send = jest.fn(async () => ({ redemption: { id: "r" }, balance: 0 }));
    const redeemer = createPrizeRedeemer({ send, make: counter() });

    redeemer.begin(prize);
    await redeemer.redeem(prize);
    redeemer.begin(prize);
    await redeemer.redeem(prize);

    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-2"]);
    expect(send.mock.calls[0][0]).toEqual({ prizeId: "p1", expectedCostPoints: 300 });
  });

  test("dois toques na mesma tentativa mandam um pedido só, com a mesma chave", async () => {
    let release;
    const send = jest.fn(() => new Promise((resolve) => (release = () => resolve({ redemption: { id: "r" }, balance: 0 }))));
    const redeemer = createPrizeRedeemer({ send, make: counter() });

    redeemer.begin(prize);
    const first = redeemer.redeem(prize);
    const second = redeemer.redeem(prize);
    release();
    await Promise.all([first, second]);

    expect(send).toHaveBeenCalledTimes(1);
  });

  test("depois de falha de rede, tocar de novo reenvia com a mesma chave", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError("Sem conexão.", { code: "network" }))
      .mockRejectedValueOnce(new ApiError("Erro.", { status: 503 }))
      .mockResolvedValueOnce({ redemption: { id: "r" }, balance: 0 });
    const redeemer = createPrizeRedeemer({ send, make: counter() });

    for (let i = 0; i < 2; i++) {
      redeemer.begin(prize);
      await redeemer.redeem(prize).catch(() => {});
    }
    redeemer.begin(prize);
    await redeemer.redeem(prize);

    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-1", "chave-1"]);
  });

  test("409 descarta a chave: a tentativa seguinte é outra", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError("Pontos insuficientes.", { status: 409, code: "conflict", reason: "insufficient_points" }))
      .mockResolvedValueOnce({ redemption: { id: "r" }, balance: 0 });
    const redeemer = createPrizeRedeemer({ send, make: counter() });

    redeemer.begin(prize);
    await redeemer.redeem(prize).catch(() => {});
    redeemer.begin(prize);
    await redeemer.redeem(prize);

    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-2"]);
  });

  test("a pessoa desistir da confirmação descarta a intenção", async () => {
    const send = jest.fn(async () => ({ redemption: { id: "r" }, balance: 0 }));
    const redeemer = createPrizeRedeemer({ send, make: counter() });

    const first = redeemer.begin(prize);
    redeemer.cancel(prize);
    const second = redeemer.begin(prize);
    expect(first).toBe("chave-1");
    expect(second).toBe("chave-2");
    await redeemer.redeem(prize);
    expect(send.mock.calls[0][1]).toBe("chave-2");
  });

  test("outro prêmio ou outro custo é outra intenção", async () => {
    const send = jest.fn(async () => ({ redemption: { id: "r" }, balance: 0 }));
    const redeemer = createPrizeRedeemer({ send, make: counter() });
    const a = redeemer.begin(prize);
    const b = redeemer.begin({ id: "p2", costPoints: 300 });
    const c = redeemer.begin({ id: "p1", costPoints: 350 });
    expect(new Set([a, b, c]).size).toBe(3);
  });

  test("o resgate sem begin também recebe chave", async () => {
    const send = jest.fn(async () => ({ redemption: { id: "r" }, balance: 0 }));
    await createPrizeRedeemer({ send, make: counter() }).redeem(prize);
    expect(send.mock.calls[0][1]).toBe("chave-1");
  });
});

describe("earnLabel: pontos que o serviço rende", () => {
  const terms = { points: { singular: "pata", plural: "patas" } };

  test("todo cliente vê, sócio do clube ou não: a função nem recebe o clube", () => {
    expect(earnLabel({ rewardPoints: 10 }, terms)).toBe("Ganha 10 patas");
    expect(earnLabel({ rewardPoints: 1 }, terms)).toBe("Ganha 1 pata");
  });

  test("sem pontos, nada", () => {
    expect(earnLabel({ rewardPoints: 0 }, terms)).toBeNull();
    expect(earnLabel({}, terms)).toBeNull();
  });
});

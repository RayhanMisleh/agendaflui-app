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

import { DEFAULT_TERMS, termsOf, pointsLabel } from "../../src/business/terms";

describe("termsOf", () => {
  test("sem conta devolve os termos padrão", () => {
    expect(termsOf(null)).toEqual(DEFAULT_TERMS);
    expect(termsOf(undefined)).toEqual(DEFAULT_TERMS);
    expect(termsOf({})).toEqual(DEFAULT_TERMS);
  });

  test("completa campo a campo o que a conta não definiu", () => {
    const terms = termsOf({ terms: { points: { singular: "patinha", plural: "patinhas" }, club: "Clube Pet" } });
    expect(terms.points).toEqual({ singular: "patinha", plural: "patinhas" });
    expect(terms.club).toBe("Clube Pet");
    expect(terms.professional).toEqual(DEFAULT_TERMS.professional);
    expect(terms.customer).toEqual(DEFAULT_TERMS.customer);
  });

  test("completa até o singular ou o plural que faltar dentro de um termo", () => {
    const terms = termsOf({ terms: { professional: { singular: "Tosador" } } });
    expect(terms.professional).toEqual({ singular: "Tosador", plural: DEFAULT_TERMS.professional.plural });
  });

  test("ignora texto vazio e valor de tipo errado", () => {
    const terms = termsOf({ terms: { club: "  ", points: { singular: "", plural: 3 }, customer: "x" } });
    expect(terms).toEqual(DEFAULT_TERMS);
  });

  test("não altera o padrão nem a conta recebida", () => {
    const business = { terms: { club: "Clube Pet" } };
    const terms = termsOf(business);
    terms.points.plural = "mudou";
    expect(DEFAULT_TERMS.points.plural).toBe("pontos");
    expect(business.terms).toEqual({ club: "Clube Pet" });
  });
});

describe("pointsLabel", () => {
  const pet = termsOf({ terms: { points: { singular: "patinha", plural: "patinhas" } } });

  test("singular só para 1", () => {
    expect(pointsLabel(1, pet)).toBe("1 patinha");
    expect(pointsLabel(1, DEFAULT_TERMS)).toBe("1 ponto");
  });

  test("zero e mais de um vão no plural", () => {
    expect(pointsLabel(0, pet)).toBe("0 patinhas");
    expect(pointsLabel(2, DEFAULT_TERMS)).toBe("2 pontos");
  });

  test("milhar no padrão pt-BR", () => {
    expect(pointsLabel(1250, DEFAULT_TERMS)).toBe("1.250 pontos");
    expect(pointsLabel(1000000, DEFAULT_TERMS)).toBe("1.000.000 pontos");
  });

  test("sem termos usa o padrão", () => {
    expect(pointsLabel(3)).toBe("3 pontos");
  });
});

import { normalizeSlug, parseStoreLink, decideStoreSwitch } from "../../src/business/storeLink";

describe("normalizeSlug", () => {
  test("apara e põe em minúsculas", () => {
    expect(normalizeSlug("  Patas-e-Pelos ")).toBe("patas-e-pelos");
    expect(normalizeSlug("a")).toBe("a");
  });

  test("recusa o que não é código de loja", () => {
    for (const bad of ["", "   ", "-x", "x-", "a b", "a_b", "açai", "a/b", null, undefined, 12, "a".repeat(65)]) {
      expect(normalizeSlug(bad)).toBeNull();
    }
    expect(normalizeSlug("a".repeat(64))).toBe("a".repeat(64));
  });
});

describe("parseStoreLink", () => {
  const uuid = "6f1c2b1e-8d3a-4f55-9a62-0c7d2a4e9b10";

  test("esquema do app", () => {
    expect(parseStoreLink("agendaflui://loja/Patas-e-Pelos")).toEqual({ slug: "patas-e-pelos", orderId: null });
    expect(parseStoreLink("agendaflui://loja/patas/")).toEqual({ slug: "patas", orderId: null });
    expect(parseStoreLink("agendaflui://loja/patas?x=1#y")).toEqual({ slug: "patas", orderId: null });
  });

  test("endereço da web, com e sem pedido", () => {
    expect(parseStoreLink(`https://app.agendaflui.com.br/patas/pedidos/${uuid}`)).toEqual({ slug: "patas", orderId: uuid });
    expect(parseStoreLink("https://app.agendaflui.com.br/patas")).toEqual({ slug: "patas", orderId: null });
    expect(parseStoreLink("http://localhost:8081/patas?pago=1")).toEqual({ slug: "patas", orderId: null });
  });

  test("só o caminho", () => {
    expect(parseStoreLink("/patas")).toEqual({ slug: "patas", orderId: null });
    expect(parseStoreLink(`/patas/pedidos/${uuid}`)).toEqual({ slug: "patas", orderId: uuid });
  });

  test("o que não é link de loja vira null", () => {
    const bad = [
      "agendaflui://outra/coisa",
      "agendaflui://loja/",
      "",
      "/",
      "/-x",
      `/${"a".repeat(65)}`,
      "https://app.agendaflui.com.br/",
      "https://app.agendaflui.com.br/index.html",
      "/patas/pedidos/",
      "/patas/outra/coisa",
      "javascript:alert(1)",
      null,
      undefined,
    ];
    for (const url of bad) expect(parseStoreLink(url)).toBeNull();
  });
});

describe("decideStoreSwitch", () => {
  test("sem loja, seleciona; mesma loja, nada; outra loja, confirma", () => {
    expect(decideStoreSwitch(null, "a")).toBe("select");
    expect(decideStoreSwitch("a", "a")).toBe("none");
    expect(decideStoreSwitch("a", "b")).toBe("confirm");
  });

  test("sem loja nova, nada", () => {
    expect(decideStoreSwitch("a", null)).toBe("none");
    expect(decideStoreSwitch(null, null)).toBe("none");
  });
});

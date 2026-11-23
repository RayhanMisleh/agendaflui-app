import { contrastRatio } from "../../src/theme/contrast";
import { storePalette } from "../../src/theme/storeBrand";
import { colors } from "../../src/theme/tokens";

const TOKENS_TERRACOTA = {
  "--brand": "#A8421F",
  "--brand-strong": "#7E3016",
  "--brand-tint": "#F6E1D8",
  "--on-brand": "#FFFFFF",
  "--brand-text": "#8A3519",
};

describe("contrastRatio", () => {
  test("preto e branco dá 21; cor igual dá 1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#0B6E66", "#0B6E66")).toBeCloseTo(1, 5);
  });
});

describe("storePalette", () => {
  test("tokens válidos da loja trocam os cinco tons da marca", () => {
    const p = storePalette({ brand: { tokens: TOKENS_TERRACOTA } });
    expect(p.brand).toBe(TOKENS_TERRACOTA["--brand"]);
    expect(p.brandStrong).toBe(TOKENS_TERRACOTA["--brand-strong"]);
    expect(p.brandTint).toBe(TOKENS_TERRACOTA["--brand-tint"]);
    expect(p.onBrand).toBe(TOKENS_TERRACOTA["--on-brand"]);
    expect(p.brandText).toBe(TOKENS_TERRACOTA["--brand-text"]);
    expect(p.ground).toBe(colors.light.ground);
    expect(p.ink).toBe(colors.light.ink);
  });

  test("sem loja, sem tokens ou com valor fora de #RRGGBB: paleta da Agenda Flui", () => {
    expect(storePalette(null)).toBe(colors.light);
    expect(storePalette({})).toBe(colors.light);
    expect(storePalette({ brand: {} })).toBe(colors.light);
    expect(storePalette({ brand: { tokens: {} } })).toBe(colors.light);
    expect(storePalette({ brand: { tokens: { ...TOKENS_TERRACOTA, "--brand": "red" } } })).toBe(colors.light);
    expect(storePalette({ brand: { tokens: { ...TOKENS_TERRACOTA, "--brand-tint": "#FFF" } } })).toBe(colors.light);
    const { "--brand-text": _omit, ...semTexto } = TOKENS_TERRACOTA;
    expect(storePalette({ brand: { tokens: semTexto } })).toBe(colors.light);
  });

  test("onBrand sem contraste 4,5 sobre brand: paleta da Agenda Flui", () => {
    const clara = { ...TOKENS_TERRACOTA, "--brand": "#F2E394" };
    expect(storePalette({ brand: { tokens: clara } })).toBe(colors.light);
  });

  test("brandText sem contraste 4,5 sobre o fundo: paleta da Agenda Flui", () => {
    const fraco = { ...TOKENS_TERRACOTA, "--brand-text": "#E8B49C" };
    expect(storePalette({ brand: { tokens: fraco } })).toBe(colors.light);
  });
});

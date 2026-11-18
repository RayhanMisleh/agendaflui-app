import { colors, radius } from "../../src/theme/tokens";

describe("tokens da marca", () => {
  test("cores do tema claro", () => {
    expect(colors.light.brand).toBe("#0B6E66");
    expect(colors.light.caramelo).toBe("#F2A93B");
    expect(colors.light.ink).toBe("#0F2A27");
    expect(colors.light.brandTint).toBe("#D7EFEB");
    expect(colors.light.ground).toBe("#F3F8F6");
  });

  test("cor de marca do tema escuro", () => {
    expect(colors.dark.brand).toBe("#3CC4B4");
  });

  test("cantos", () => {
    expect(radius).toEqual({ sm: 10, lg: 16, xl: 28, pill: 999 });
  });

  test("as duas paletas têm as mesmas chaves", () => {
    expect(Object.keys(colors.dark).sort()).toEqual(
      Object.keys(colors.light).sort()
    );
  });
});

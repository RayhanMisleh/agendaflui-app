import { formatCents, durationLabel } from "../../src/utils/money";

describe("formatCents", () => {
  test("reais com vírgula, sem depender do aparelho", () => {
    expect(formatCents(4000)).toBe("R$ 40,00");
    expect(formatCents(4590)).toBe("R$ 45,90");
    expect(formatCents(5)).toBe("R$ 0,05");
    expect(formatCents(123456789)).toBe("R$ 1.234.567,89");
    expect(formatCents(0)).toBe("R$ 0,00");
  });
  test("valor inválido vira zero", () => {
    expect(formatCents(undefined)).toBe("R$ 0,00");
    expect(formatCents(null)).toBe("R$ 0,00");
  });
});

describe("durationLabel", () => {
  test("minutos e horas", () => {
    expect(durationLabel(30)).toBe("30 min");
    expect(durationLabel(60)).toBe("1 h");
    expect(durationLabel(90)).toBe("1 h 30 min");
    expect(durationLabel(0)).toBe("");
  });
});

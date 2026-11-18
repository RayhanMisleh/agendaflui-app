import { localDateIn, addDays, bookingRange, formatDay, dayParts } from "../../src/utils/time";

describe("localDateIn", () => {
  test("data local no fuso da conta", () => {
    expect(localDateIn("America/Sao_Paulo", "2026-11-19T02:30:00Z")).toBe("2026-11-18");
    expect(localDateIn("Asia/Tokyo", "2026-11-18T16:00:00Z")).toBe("2026-11-19");
    expect(localDateIn("America/Sao_Paulo", new Date("2026-11-18T15:00:00Z"))).toBe("2026-11-18");
  });
});

describe("addDays", () => {
  test("aritmética de calendário, sem fuso", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-11-18", 0)).toBe("2026-11-18");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-18", 30)).toBe("2026-12-18");
  });
});

describe("bookingRange", () => {
  const now = new Date("2026-11-19T02:30:00Z"); // ainda dia 18 em São Paulo

  test("começa hoje no fuso da conta e limita a 30 dias", () => {
    expect(bookingRange("America/Sao_Paulo", now, 90)).toEqual({ from: "2026-11-18", to: "2026-12-18" });
  });

  test("respeita a antecedência menor que 30 dias", () => {
    expect(bookingRange("America/Sao_Paulo", now, 10)).toEqual({ from: "2026-11-18", to: "2026-11-28" });
  });

  test("antecedência ausente ou inválida cai nos 30 dias", () => {
    expect(bookingRange("America/Sao_Paulo", now, undefined).to).toBe("2026-12-18");
    expect(bookingRange("America/Sao_Paulo", now, 0).to).toBe("2026-12-18");
  });
});

describe("formatDay e dayParts", () => {
  test("rótulo do dia a partir da data da conta, sem depender do fuso do aparelho", () => {
    expect(formatDay("2026-11-18")).toBe("quarta-feira, 18 de novembro");
    expect(formatDay("2027-01-01")).toBe("sexta-feira, 1 de janeiro");
  });

  test("dayParts devolve o número do dia e o mês abreviado", () => {
    expect(dayParts("2026-11-05")).toEqual({ day: "5", month: "nov" });
  });
});

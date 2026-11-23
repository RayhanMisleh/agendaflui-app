import { blockInput, contactLinks } from "../../src/staff/forms";

const form = (extra = {}) => ({ professionalId: "p1", date: "2026-11-24", start: "09:00", end: "10:30", reason: "", ...extra });

describe("blockInput", () => {
  test("fim antes do início volta erro no campo end", () => {
    const result = blockInput(form({ start: "10:00", end: "09:00" }));
    expect(result.ok).toBe(false);
    expect(Object.keys(result.fields)).toEqual(["end"]);
    expect(result.fields.end).toMatch(/depois/);
  });

  test("fim igual ao início também é erro", () => {
    expect(blockInput(form({ start: "10:00", end: "10:00" })).fields.end).toBeTruthy();
  });

  test("bloqueio válido monta o corpo do contrato com reason null quando vazio", () => {
    expect(blockInput(form())).toEqual({
      ok: true,
      body: { professionalId: "p1", startDate: "2026-11-24", startTime: "09:00", endTime: "10:30", reason: null },
    });
    expect(blockInput(form({ reason: "   " })).body.reason).toBeNull();
  });

  test("motivo é aparado e limitado a 200 caracteres", () => {
    expect(blockInput(form({ reason: "  Almoço  " })).body.reason).toBe("Almoço");
    expect(blockInput(form({ reason: "a".repeat(200) })).ok).toBe(true);
    const long = blockInput(form({ reason: "a".repeat(201) }));
    expect(long.ok).toBe(false);
    expect(long.fields.reason).toBeTruthy();
  });

  test("aceita 24:00 como fim do dia, mas não como início", () => {
    expect(blockInput(form({ start: "18:00", end: "24:00" })).body.endTime).toBe("24:00");
    expect(blockInput(form({ start: "24:00", end: "24:00" })).fields.start).toBeTruthy();
  });

  test("hora fora do formato HH:MM é erro no campo", () => {
    const result = blockInput(form({ start: "9h", end: "25:00" }));
    expect(result.ok).toBe(false);
    expect(Object.keys(result.fields).sort()).toEqual(["end", "start"]);
    expect(blockInput(form({ start: "09:60" })).fields.start).toBeTruthy();
    expect(blockInput(form({ start: "", end: "" })).ok).toBe(false);
  });

  test("profissional e data são obrigatórios e a data precisa existir", () => {
    expect(blockInput(form({ professionalId: "" })).fields.professionalId).toBeTruthy();
    expect(blockInput(form({ date: "2026-02-30" })).fields.date).toBeTruthy();
    expect(blockInput(form({ date: "24/11/2026" })).fields.date).toBeTruthy();
  });
});

describe("contactLinks", () => {
  test("telefone vira tel: só com dígitos e +", () => {
    const links = contactLinks({ phone: "+55 (11) 91234-5678", phoneLabel: "(11) 91234-5678", email: null });
    expect(links).toEqual([{ kind: "phone", label: "(11) 91234-5678", url: "tel:+5511912345678" }]);
  });

  test("sem e-mail, sem link de e-mail; sem telefone, sem link de telefone", () => {
    expect(contactLinks({ phone: "11912345678", email: "" }).map((l) => l.kind)).toEqual(["phone"]);
    expect(contactLinks({ phone: null, email: "ana@exemplo.com" })).toEqual([{ kind: "email", label: "ana@exemplo.com", url: "mailto:ana@exemplo.com" }]);
  });

  test("sem dado nenhum, lista vazia", () => {
    expect(contactLinks({})).toEqual([]);
    expect(contactLinks(null)).toEqual([]);
    expect(contactLinks({ phone: "sem número", email: "   " })).toEqual([]);
  });

  test("usa o próprio número quando não há rótulo", () => {
    expect(contactLinks({ phone: "11912345678" })[0].label).toBe("11912345678");
  });
});

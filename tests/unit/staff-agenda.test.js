import { agendaRange, agendaDays, agendaTimeline, appointmentActions, canFilterProfessionals, shiftDate } from "../../src/staff/agenda";

const appt = (id, startsAt, status = "CONFIRMED", extra = {}) => ({ id, status, startsAt, endsAt: startsAt, ...extra });

describe("agendaRange", () => {
  test("semana de segunda a domingo", () => {
    expect(agendaRange("week", "2026-11-26")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
  });

  test("segunda e domingo ficam na própria semana", () => {
    expect(agendaRange("week", "2026-11-23")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(agendaRange("week", "2026-11-29")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
  });

  test("semana que atravessa o ano", () => {
    expect(agendaRange("week", "2027-01-01")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });

  test("dia: from e to iguais", () => {
    expect(agendaRange("day", "2026-11-26")).toEqual({ from: "2026-11-26", to: "2026-11-26" });
  });
});

describe("shiftDate", () => {
  test("dia anda de 1 em 1 e semana de 7 em 7", () => {
    expect(shiftDate("day", "2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftDate("day", "2026-11-30", -1)).toBe("2026-11-29");
    expect(shiftDate("week", "2026-11-26", 1)).toBe("2026-12-03");
    expect(shiftDate("week", "2026-11-26", -1)).toBe("2026-11-19");
  });
});

describe("agendaDays", () => {
  const days = [
    {
      date: "2026-11-23",
      closed: false,
      closureReason: null,
      professionals: [
        {
          id: "p1",
          name: "Ana",
          appointments: [appt("a3", "2026-11-23T15:00:00.000Z"), appt("a1", "2026-11-23T12:00:00.000Z")],
          blocks: [{ id: "b1", professionalId: "p1", startsAt: "2026-11-23T13:00:00.000Z", endsAt: "2026-11-23T14:00:00.000Z", reason: "Almoço" }],
        },
        { id: "p2", name: "Bia", appointments: [appt("a2", "2026-11-23T13:30:00.000Z")], blocks: [] },
      ],
    },
    { date: "2026-11-24", closed: true, closureReason: "Feriado", professionals: [] },
  ];

  test("junta as colunas em ordem de início", () => {
    const result = agendaDays(days);
    expect(result.map((d) => d.date)).toEqual(["2026-11-23", "2026-11-24"]);
    expect(result[0].items.map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
  });

  test("filtra por profissional (atendimentos e bloqueios)", () => {
    const [first] = agendaDays(days, { professionalId: "p2" });
    expect(first.items.map((a) => a.id)).toEqual(["a2"]);
    expect(first.blocks).toEqual([]);
    const [own] = agendaDays(days, { professionalId: "p1" });
    expect(own.items.map((a) => a.id)).toEqual(["a1", "a3"]);
    expect(own.blocks.map((b) => b.id)).toEqual(["b1"]);
  });

  test("dia fechado vem sem itens e com o motivo", () => {
    const closed = agendaDays(days)[1];
    expect(closed).toMatchObject({ date: "2026-11-24", closed: true, closureReason: "Feriado", items: [], blocks: [] });
  });

  test("sem dias, lista vazia", () => {
    expect(agendaDays(undefined)).toEqual([]);
  });

  test("linha do tempo mistura atendimentos e bloqueios por início", () => {
    const [first] = agendaDays(days);
    expect(agendaTimeline(first).map((e) => `${e.kind}:${e.value.id}`)).toEqual(["appointment:a1", "block:b1", "appointment:a2", "appointment:a3"]);
  });
});

describe("appointmentActions", () => {
  const start = "2026-11-23T12:00:00.000Z";
  const before = "2026-11-23T11:59:59.000Z";
  const after = "2026-11-23T12:00:00.000Z";

  test("pendente: confirmar, cancelar e remarcar, antes e depois do início", () => {
    expect(appointmentActions(appt("a", start, "PENDING"), before)).toEqual(["confirm", "cancel", "reschedule"]);
    expect(appointmentActions(appt("a", start, "PENDING"), after)).toEqual(["confirm", "cancel", "reschedule"]);
  });

  test("confirmado antes do início: só cancelar e remarcar", () => {
    expect(appointmentActions(appt("a", start), before)).toEqual(["cancel", "reschedule"]);
  });

  test("confirmado depois do início: concluir e falta também", () => {
    expect(appointmentActions(appt("a", start), after)).toEqual(["complete", "no_show", "cancel", "reschedule"]);
  });

  test.each(["COMPLETED", "CANCELED", "NO_SHOW"])("%s não tem ação", (status) => {
    expect(appointmentActions(appt("a", start, status), after)).toEqual([]);
  });

  test("situação desconhecida ou sem atendimento não tem ação", () => {
    expect(appointmentActions(appt("a", start, "OUTRA"), after)).toEqual([]);
    expect(appointmentActions(null, after)).toEqual([]);
  });
});

describe("canFilterProfessionals", () => {
  test("só com view_all_agendas", () => {
    expect(canFilterProfessionals({ capabilities: ["view_own_agenda", "view_all_agendas"] })).toBe(true);
    expect(canFilterProfessionals({ capabilities: ["view_own_agenda", "view_clients"] })).toBe(false);
  });

  test("perfil ausente ou sem lista não filtra", () => {
    expect(canFilterProfessionals(null)).toBe(false);
    expect(canFilterProfessionals({})).toBe(false);
  });
});

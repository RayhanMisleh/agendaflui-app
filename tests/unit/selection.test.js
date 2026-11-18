import {
  ANY_PROFESSIONAL,
  servicesFor,
  professionalParam,
  canPickService,
  buildBooking,
  bookingSignature,
  appointmentStatus,
} from "../../src/booking/selection";

const services = [
  { id: "s1", name: "Corte" },
  { id: "s2", name: "Banho" },
  { id: "s3", name: "Tosa" },
];
const professionals = [
  { id: "p1", name: "Ana", serviceIds: ["s3", "s1"] },
  { id: "p2", name: "Bia", serviceIds: [] },
];

describe("servicesFor", () => {
  test("qualquer profissional mostra todos os serviços", () => {
    expect(servicesFor(ANY_PROFESSIONAL, professionals, services)).toEqual(services);
  });

  test("profissional escolhido mostra só os dele, na ordem dos serviços", () => {
    expect(servicesFor("p1", professionals, services).map((s) => s.id)).toEqual(["s1", "s3"]);
  });

  test("profissional sem serviço ou desconhecido não mostra nenhum", () => {
    expect(servicesFor("p2", professionals, services)).toEqual([]);
    expect(servicesFor("p9", professionals, services)).toEqual([]);
  });
});

describe("professionalParam", () => {
  test("'any' vira null; um id segue como está", () => {
    expect(ANY_PROFESSIONAL).toBe("any");
    expect(professionalParam("any")).toBeNull();
    expect(professionalParam(null)).toBeNull();
    expect(professionalParam("p1")).toBe("p1");
  });
});

describe("canPickService", () => {
  test("serviço só do clube exige sócio", () => {
    expect(canPickService({ clubOnly: true }, false)).toBe(false);
    expect(canPickService({ clubOnly: true }, true)).toBe(true);
    expect(canPickService({ clubOnly: false }, false)).toBe(true);
    expect(canPickService({}, false)).toBe(true);
  });
});

describe("montagem do agendamento", () => {
  test("qualquer profissional: professionalId nulo, um só serviço", () => {
    expect(buildBooking({ serviceId: "s1", startsAt: "2026-11-18T12:00:00.000Z", professionalId: "any" })).toEqual({
      serviceIds: ["s1"],
      startsAt: "2026-11-18T12:00:00.000Z",
      professionalId: null,
    });
  });

  test("profissional escolhido segue no corpo", () => {
    expect(buildBooking({ serviceId: "s1", startsAt: "2026-11-18T12:00:00.000Z", professionalId: "p1" }).professionalId).toBe("p1");
  });

  test("a assinatura muda com o conteúdo e repete com o mesmo conteúdo", () => {
    const a = buildBooking({ serviceId: "s1", startsAt: "2026-11-18T12:00:00.000Z", professionalId: "p1" });
    const same = buildBooking({ serviceId: "s1", startsAt: "2026-11-18T12:00:00.000Z", professionalId: "p1" });
    const other = buildBooking({ serviceId: "s1", startsAt: "2026-11-18T12:30:00.000Z", professionalId: "p1" });
    expect(bookingSignature(a)).toBe(bookingSignature(same));
    expect(bookingSignature(a)).not.toBe(bookingSignature(other));
  });
});

describe("situação do agendamento", () => {
  test("texto fixo por situação", () => {
    expect(appointmentStatus("PENDING").label).toBe("Aguardando confirmação");
    expect(appointmentStatus("CONFIRMED").label).toBe("Confirmado");
    expect(appointmentStatus("COMPLETED").label).toBe("Concluído");
    expect(appointmentStatus("CANCELED").label).toBe("Cancelado");
    expect(appointmentStatus("NO_SHOW").label).toBe("Falta");
  });

  test("situação desconhecida não quebra", () => {
    expect(appointmentStatus("XYZ").label).toBe("Situação indisponível");
  });
});

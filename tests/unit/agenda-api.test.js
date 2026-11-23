import {
  listServices,
  listProfessionals,
  availableDays,
  availableSlots,
  createAppointment,
  nextAppointment,
  listAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "../../src/api/agenda";

let mockHandler;

// O módulo usa o cliente único; aqui ele ganha um adaptador falso (nada sai do processo).
jest.mock("../../src/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter } = jest.requireActual("../helpers/fake-adapter");
  const adapter = fakeAdapter((call) => mockHandler(call));
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    getSlug: () => "patas",
    tokens: { get: () => null, set: async () => {}, clear: async () => {} },
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { api: client, __adapter: adapter };
});

const adapter = require("../../src/api").__adapter;
const last = () => adapter.calls[adapter.calls.length - 1];

beforeEach(() => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 200, data: {} });
});

describe("catálogo", () => {
  test("listServices e listProfessionals devolvem items", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "s1" }] } });
    await expect(listServices()).resolves.toEqual([{ id: "s1" }]);
    expect(last().method).toBe("GET");
    expect(last().url).toBe("/services");
    await expect(listProfessionals()).resolves.toEqual([{ id: "s1" }]);
    expect(last().url).toBe("/professionals");
  });
});

describe("disponibilidade", () => {
  test("availableDays une os serviços por vírgula e não manda professionalId nulo", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ date: "2026-11-18", weekday: "qua", available: true }] } });
    const days = await availableDays({
      from: "2026-11-18",
      to: "2026-12-18",
      serviceIds: ["s1", "s2"],
      professionalId: null,
    });
    expect(days).toEqual([{ date: "2026-11-18", weekday: "qua", available: true }]);
    expect(last().method).toBe("GET");
    expect(last().url).toBe("/availability/days");
    expect(last().params).toEqual({ from: "2026-11-18", to: "2026-12-18", serviceIds: "s1,s2" });
    expect("professionalId" in last().params).toBe(false);
  });

  test("availableDays manda professionalId quando há", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [] } });
    await availableDays({ from: "2026-11-18", to: "2026-11-19", serviceIds: ["s1"], professionalId: "p1" });
    expect(last().params.professionalId).toBe("p1");
  });

  test("availableSlots devolve slots, total e duração", async () => {
    const data = { date: "2026-11-18", durationMin: 30, totalCents: 4000, slots: [{ startsAt: "2026-11-18T12:00:00.000Z", label: "09:00", professionalIds: ["p1"] }] };
    mockHandler = async () => ({ status: 200, data });
    await expect(availableSlots({ date: "2026-11-18", serviceIds: ["s1"], professionalId: undefined })).resolves.toEqual(data);
    expect(last().url).toBe("/availability");
    expect(last().params).toEqual({ date: "2026-11-18", serviceIds: "s1" });
  });
});

describe("agendamentos", () => {
  test("createAppointment manda a Idempotency-Key e só os campos do contrato", async () => {
    mockHandler = async () => ({ status: 201, data: { id: "a1" } });
    const result = await createAppointment(
      { serviceIds: ["s1"], startsAt: "2026-11-18T12:00:00.000Z", professionalId: null, extra: "não vai" },
      "k1"
    );
    expect(result).toEqual({ id: "a1" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/appointments");
    expect(last().headers["idempotency-key"]).toBe("k1");
    expect(last().data).toEqual({ serviceIds: ["s1"], startsAt: "2026-11-18T12:00:00.000Z", professionalId: null });
  });

  test("createAppointment leva a observação só quando há", async () => {
    mockHandler = async () => ({ status: 201, data: { id: "a1" } });
    await createAppointment({ serviceIds: ["s1"], startsAt: "2026-11-18T12:00:00.000Z", customerNote: "Chego cedo" }, "k2");
    expect(last().data).toEqual({ serviceIds: ["s1"], startsAt: "2026-11-18T12:00:00.000Z", customerNote: "Chego cedo" });
    expect("professionalId" in last().data).toBe(false);
  });

  test("nextAppointment devolve null quando não há próximo", async () => {
    mockHandler = async () => ({ status: 200, data: { appointment: null } });
    await expect(nextAppointment()).resolves.toBeNull();
    expect(last().url).toBe("/appointments/next");
  });

  test("nextAppointment devolve o agendamento", async () => {
    mockHandler = async () => ({ status: 200, data: { appointment: { id: "a1" } } });
    await expect(nextAppointment()).resolves.toEqual({ id: "a1" });
  });

  test("listAppointments manda scope e cursor e devolve items e nextCursor", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "a1" }], nextCursor: "c2" } });
    await expect(listAppointments({ scope: "past", cursor: "c1" })).resolves.toEqual({ items: [{ id: "a1" }], nextCursor: "c2" });
    expect(last().url).toBe("/appointments");
    expect(last().params).toEqual({ scope: "past", cursor: "c1" });
    await listAppointments({ scope: "upcoming" });
    expect(last().params).toEqual({ scope: "upcoming" });
  });

  test("cancelAppointment usa POST /appointments/{id}/cancel", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "a1", status: "CANCELED" } });
    await expect(cancelAppointment("a1")).resolves.toEqual({ id: "a1", status: "CANCELED" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/appointments/a1/cancel");
  });

  test("rescheduleAppointment usa POST /appointments/{id}/reschedule só com horário", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "a1" } });
    await rescheduleAppointment("a1", { startsAt: "2026-11-19T12:00:00.000Z" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/appointments/a1/reschedule");
    expect(last().data).toEqual({ startsAt: "2026-11-19T12:00:00.000Z" });
  });

  test("rescheduleAppointment leva o profissional quando há", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "a1" } });
    await rescheduleAppointment("a1", { startsAt: "2026-11-19T12:00:00.000Z", professionalId: "p2" });
    expect(last().data).toEqual({ startsAt: "2026-11-19T12:00:00.000Z", professionalId: "p2" });
  });
});

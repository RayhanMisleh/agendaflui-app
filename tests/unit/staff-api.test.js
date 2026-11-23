let mockHandler;

jest.mock("../../src/staff/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter: make } = jest.requireActual("../helpers/fake-adapter");
  const adapter = make((call) => mockHandler(call));
  const staffApi = createApiClient({
    baseURL: "https://api.test/v1",
    getSlug: () => "patas",
    tokens: { get: () => ({ accessToken: "acc-1" }), generation: () => 0, set: async () => {}, clear: async () => {} },
    authPrefix: "/auth/staff/",
    refreshPath: "/auth/staff/refresh",
    anonymousPaths: ["/availability", "/business"],
    noBusinessPaths: ["/auth/staff/login"],
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { staffApi, __adapter: adapter };
});

const staff = require("../../src/api/staff");
const adapter = require("../../src/staff/api").__adapter;

beforeEach(() => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 200, data: { items: [], days: [], slots: [] } });
});

const cases = [
  ["staffLogin", () => staff.staffLogin({ email: "  A@B.com ", password: "s" }), "POST", "/auth/staff/login", { email: "a@b.com", password: "s" }],
  ["staffLogout", () => staff.staffLogout("ref-1", "patas"), "POST", "/auth/staff/logout", { refreshToken: "ref-1" }],
  ["getStaffMe", () => staff.getStaffMe(), "GET", "/staff/me", null],
  ["setNotifyAll", () => staff.setNotifyAll(true), "PATCH", "/staff/me", { notifyAllAppointments: true }],
  ["getAgenda", () => staff.getAgenda({ from: "2026-11-23", to: "2026-11-29", professionalId: "p1" }), "GET", "/staff/agenda", null],
  ["getStaffAppointment", () => staff.getStaffAppointment("a/1"), "GET", "/staff/appointments/a%2F1", null],
  ["confirmAppointment", () => staff.confirmAppointment("a1"), "POST", "/staff/appointments/a1/confirm", null],
  ["completeAppointment", () => staff.completeAppointment("a1"), "POST", "/staff/appointments/a1/complete", null],
  ["markNoShow", () => staff.markNoShow("a1"), "POST", "/staff/appointments/a1/no-show", null],
  ["cancelStaffAppointment", () => staff.cancelStaffAppointment("a1", "Doente"), "POST", "/staff/appointments/a1/cancel", { reason: "Doente" }],
  ["rescheduleStaffAppointment", () => staff.rescheduleStaffAppointment("a1", { startsAt: "2026-11-24T13:00:00.000Z", professionalId: "p1" }), "POST", "/staff/appointments/a1/reschedule", { startsAt: "2026-11-24T13:00:00.000Z", professionalId: "p1" }],
  ["freeSlots", () => staff.freeSlots({ date: "2026-11-24", serviceIds: ["s1", "s2"], professionalId: "p1" }), "GET", "/availability", null],
  ["listStaffProfessionals", () => staff.listStaffProfessionals(), "GET", "/staff/professionals", null],
  ["createTimeBlock", () => staff.createTimeBlock({ professionalId: "p1", startsAt: "a", endsAt: "b", reason: null }), "POST", "/staff/time-blocks", { professionalId: "p1", startsAt: "a", endsAt: "b", reason: null }],
  ["getStaffCustomer", () => staff.getStaffCustomer("c1"), "GET", "/staff/customers/c1", null],
  ["listCustomerAppointments", () => staff.listCustomerAppointments("c1", { scope: "past", cursor: "x" }), "GET", "/staff/customers/c1/appointments", null],
];

describe("src/api/staff.js", () => {
  test.each(cases)("%s chama o método e o caminho do contrato", async (name, run, method, url, body) => {
    await run();
    expect(adapter.calls).toHaveLength(1);
    const call = adapter.calls[0];
    expect(call.method).toBe(method);
    expect(call.url).toBe(url);
    if (body) expect(call.data).toEqual(body);
  });

  test("parâmetros de consulta saem sem campos vazios", async () => {
    await staff.getAgenda({ from: "2026-11-23", to: "2026-11-23", professionalId: null });
    await staff.freeSlots({ date: "2026-11-24", serviceIds: ["s1", "s2"], professionalId: "p1" });
    await staff.listCustomerAppointments("c1", { scope: "upcoming" });
    expect(adapter.calls[0].params).toEqual({ from: "2026-11-23", to: "2026-11-23" });
    expect(adapter.calls[1].params).toEqual({ date: "2026-11-24", serviceIds: "s1,s2", professionalId: "p1" });
    expect(adapter.calls[2].params).toEqual({ scope: "upcoming" });
  });

  test("login sai sem X-Business e freeSlots sem token; as demais com token e loja", async () => {
    await staff.staffLogin({ email: "a@b.com", password: "s" });
    await staff.freeSlots({ date: "2026-11-24", serviceIds: ["s1"] });
    await staff.getStaffMe();
    expect(adapter.calls[0].headers["x-business"]).toBeUndefined();
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
    expect(adapter.calls[1].headers.authorization).toBeUndefined();
    expect(adapter.calls[1].headers["x-business"]).toBe("patas");
    expect(adapter.calls[2].headers.authorization).toBe("Bearer acc-1");
  });

  test("staffLogout leva a loja informada e nunca o token", async () => {
    await staff.staffLogout("ref-1", "outra");
    expect(adapter.calls[0].headers["x-business"]).toBe("outra");
    expect(adapter.calls[0].headers.authorization).toBeUndefined();
  });

  test("devolve o corpo da resposta", async () => {
    mockHandler = async () => ({ status: 200, data: { userId: "u1", capabilities: [] } });
    expect(await staff.getStaffMe()).toEqual({ userId: "u1", capabilities: [] });
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "p1" }] } });
    expect(await staff.listStaffProfessionals()).toEqual([{ id: "p1" }]);
  });

  test("a API recusa: o erro do servidor chega como ApiError", async () => {
    mockHandler = async () => ({ status: 403, data: { error: { code: "forbidden", message: "Sem permissão." } } });
    await expect(staff.getStaffAppointment("a1")).rejects.toMatchObject({ status: 403, message: "Sem permissão." });
  });
});

import { appointmentTarget } from "../../src/staff/notificationTarget";

const response = (data) => ({ notification: { request: { content: { data } } } });

describe("appointmentTarget", () => {
  test("aviso com atendimento vira os parâmetros da tela Atendimento", () => {
    expect(appointmentTarget(response({ appointmentId: 42 }))).toEqual({
      screen: "Atendimento",
      params: { appointmentId: "42" },
      initial: false,
    });
  });

  test("sem atendimento, resposta vazia ou nula: nada", () => {
    expect(appointmentTarget(response({}))).toBeNull();
    expect(appointmentTarget(response(undefined))).toBeNull();
    expect(appointmentTarget(null)).toBeNull();
  });
});

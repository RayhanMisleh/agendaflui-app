import { AxiosError, AxiosHeaders } from "axios";
import {
  ApiError,
  NETWORK_MESSAGE,
  TIMEOUT_MESSAGE,
  toApiError,
  isModuleDisabled,
} from "../../src/api/errors";

function httpError(status, body, headers = {}) {
  const config = { headers: new AxiosHeaders() };
  const response = { status, statusText: "", data: body, headers: new AxiosHeaders(headers), config };
  return new AxiosError("falhou", "ERR_BAD_REQUEST", config, {}, response);
}

describe("toApiError", () => {
  test("lê status, code, reason e message do corpo do contrato", () => {
    const e = toApiError(
      httpError(409, { error: { code: "conflict", reason: "slot_taken", message: "Esse horário acabou de ser ocupado." } })
    );
    expect(e).toBeInstanceOf(ApiError);
    expect(e.status).toBe(409);
    expect(e.code).toBe("conflict");
    expect(e.reason).toBe("slot_taken");
    expect(e.message).toBe("Esse horário acabou de ser ocupado.");
  });

  test("guarda campos, id da requisição e espera do limite", () => {
    const e = toApiError(
      httpError(
        429,
        { error: { code: "rate_limited", message: "Muitas requisições.", fields: { email: "Informe o e-mail." } } },
        { "x-request-id": "req-123", "retry-after": "7" }
      )
    );
    expect(e.fields).toEqual({ email: "Informe o e-mail." });
    expect(e.requestId).toBe("req-123");
    expect(e.retryAfterSec).toBe(7);
  });

  test("sem resposta: mensagem de conexão", () => {
    const config = { headers: new AxiosHeaders() };
    const e = toApiError(new AxiosError("Network Error", "ERR_NETWORK", config, {}));
    expect(e.message).toBe(NETWORK_MESSAGE);
    expect(e.status).toBeNull();
  });

  test("ECONNABORTED: mensagem de tempo esgotado", () => {
    const config = { headers: new AxiosHeaders() };
    const e = toApiError(new AxiosError("timeout of 15000ms exceeded", "ECONNABORTED", config, {}));
    expect(e.message).toBe(TIMEOUT_MESSAGE);
  });

  test("resposta que não segue o contrato ganha mensagem genérica, sem vazar o texto técnico", () => {
    const e = toApiError(httpError(502, "<html>Bad Gateway</html>"));
    expect(e.status).toBe(502);
    expect(e.message).not.toMatch(/html|gateway|falhou/i);
    expect(e.message.length).toBeGreaterThan(10);
  });

  test("ApiError passa como está", () => {
    const original = new ApiError("x", { status: 400 });
    expect(toApiError(original)).toBe(original);
  });

  test("erro qualquer vira ApiError sem expor a mensagem", () => {
    const e = toApiError(new Error("detalhe interno"));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.message).not.toMatch(/interno/);
  });
});

describe("isModuleDisabled", () => {
  test("só para 404 module_disabled", () => {
    expect(isModuleDisabled(new ApiError("x", { status: 404, code: "module_disabled" }))).toBe(true);
    expect(isModuleDisabled(new ApiError("x", { status: 404, code: "not_found" }))).toBe(false);
    expect(isModuleDisabled(new ApiError("x", { status: 403, code: "module_disabled" }))).toBe(false);
    expect(isModuleDisabled(null)).toBe(false);
  });
});

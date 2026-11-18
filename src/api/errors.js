export const NETWORK_MESSAGE = "Sem conexão. Confira a internet e tente de novo.";
export const TIMEOUT_MESSAGE = "A conexão demorou demais. Tente de novo.";
export const SESSION_ENDED_MESSAGE = "Sua sessão venceu. Entre de novo.";
const GENERIC_MESSAGE = "Algo deu errado. Tente de novo em instantes.";

// Erro da API v1: `{ error: { code, reason?, message, fields?, details? } }`.
export class ApiError extends Error {
  constructor(message, { status = null, code = null, reason = null, fields = null, requestId = null, retryAfterSec = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.reason = reason;
    this.fields = fields;
    this.requestId = requestId;
    this.retryAfterSec = retryAfterSec;
  }
}

function header(headers, name) {
  if (!headers) return null;
  const value = typeof headers.get === "function" ? headers.get(name) : headers[name];
  return value === undefined || value === null ? null : String(value);
}

function text(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

// Qualquer falha (AxiosError ou outra) vira ApiError; a mensagem técnica nunca chega à pessoa.
export function toApiError(error) {
  if (error instanceof ApiError) return error;

  const response = error && error.response;
  if (response) {
    const body = response.data && typeof response.data === "object" ? response.data.error : null;
    const retry = Number.parseInt(header(response.headers, "retry-after") || "", 10);
    return new ApiError((body && text(body.message)) || GENERIC_MESSAGE, {
      status: response.status,
      code: (body && text(body.code)) || null,
      reason: (body && text(body.reason)) || null,
      fields: body && body.fields && typeof body.fields === "object" ? body.fields : null,
      requestId: header(response.headers, "x-request-id"),
      retryAfterSec: Number.isFinite(retry) ? retry : null,
    });
  }

  if (error && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")) {
    return new ApiError(TIMEOUT_MESSAGE, { code: "timeout" });
  }
  if (error && error.isAxiosError) {
    return new ApiError(NETWORK_MESSAGE, { code: "network" });
  }
  return new ApiError(GENERIC_MESSAGE, { code: "unknown" });
}

export function isModuleDisabled(error) {
  return Boolean(error) && error.status === 404 && error.code === "module_disabled";
}

import { ApiError } from "./errors";

export const UNKNOWN_BUSINESS_MESSAGE = "Não achamos essa loja. Confira o código.";

// Confere o código da loja: a API responde 401 unknown_business para um código que não existe.
export async function fetchBusiness(http, slug) {
  try {
    const response = await http.get("/business", { headers: { "X-Business": slug } });
    return response.data;
  } catch (error) {
    if (error && error.status === 401 && error.reason === "unknown_business") {
      throw new ApiError(UNKNOWN_BUSINESS_MESSAGE, {
        status: error.status,
        code: error.code,
        reason: error.reason,
        requestId: error.requestId,
      });
    }
    throw error;
  }
}

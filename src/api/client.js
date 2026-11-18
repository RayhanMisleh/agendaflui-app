import axios from "axios";
import { ApiError, toApiError, SESSION_ENDED_MESSAGE } from "./errors";

const AUTH_PATH = "/auth/customer/";
const REFRESH_PATH = "/auth/customer/refresh";
const NO_BUSINESS_MESSAGE = "Escolha a sua loja para continuar.";
const NO_APP_KEY_MESSAGE = "App sem chave de acesso. Avise o suporte.";
// Só caminhos relativos à base da API: URL absoluta levaria a chave e o token a outro host.
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

function pathOf(url) {
  const text = String(url || "");
  return text.replace(/^https?:\/\/[^/]+(?:\/v1)?/i, "").split("?")[0];
}

function sessionEnded() {
  return new ApiError(SESSION_ENDED_MESSAGE, { status: 401, code: "unauthorized", reason: "session_ended" });
}

// Cliente único da API v1. Toda requisição leva a chave da plataforma e a loja (X-Business); o token só vai
// quando a requisição é da loja ativa. `http` rejeita sempre com ApiError.
export function createApiClient({ baseURL, appKey, appKeyMissing = !appKey, getSlug, tokens, onSessionEnded, onBusinessGone, adapter }) {
  const http = axios.create({
    baseURL,
    timeout: 15000,
    adapter,
    headers: { "Content-Type": "application/json" },
  });

  // Uma renovação por loja: um 401 de outra loja não entra na fila desta.
  const pending = new Map();

  async function renew(slug) {
    const current = tokens.get();
    const gen = tokens.generation();
    if (!slug || !current || !current.refreshToken) throw sessionEnded();

    let response;
    try {
      // A loja vai explícita: é a do envio, mesmo que a ativa mude enquanto espera.
      response = await http.post(REFRESH_PATH, { refreshToken: current.refreshToken }, { headers: { "X-Business": slug } });
    } catch (error) {
      // Recusa de verdade (4xx, menos tempo esgotado e limite): a sessão acabou. Rede, 5xx e limite: tokens ficam.
      const refused = error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429;
      if (!refused) throw error;
      // Só apaga se a sessão ainda é a que pediu: quem saiu e entrou de novo no meio não perde a sessão nova.
      if (getSlug() === slug && tokens.generation() === gen) {
        await tokens.clear();
        onSessionEnded();
      }
      throw sessionEnded();
    }

    const fresh = response.data && response.data.tokens;
    if (!fresh || typeof fresh.accessToken !== "string" || typeof fresh.refreshToken !== "string") {
      throw new ApiError("Algo deu errado. Tente de novo em instantes.", { status: response.status, code: "unknown" });
    }
    // A loja mudou ou a pessoa saiu (ou entrou de novo) durante a renovação: o par novo é da sessão anterior.
    if (getSlug() !== slug || !(await tokens.setIf(gen, fresh))) throw sessionEnded();
    return fresh;
  }

  // Fila única por loja: quem chega com a renovação em andamento espera a mesma.
  function refresh(slug) {
    if (!pending.has(slug)) {
      const promise = renew(slug).finally(() => {
        if (pending.get(slug) === promise) pending.delete(slug);
      });
      pending.set(slug, promise);
    }
    return pending.get(slug);
  }

  http.interceptors.request.use((request) => {
    if (ABSOLUTE_URL.test(String(request.url || ""))) {
      return Promise.reject(new ApiError("Endereço inválido.", { code: "invalid_url" }));
    }
    if (appKeyMissing) return Promise.reject(new ApiError(NO_APP_KEY_MESSAGE, { code: "app_key_missing" }));
    const slug = request.headers.get("X-Business") || getSlug();
    if (!slug) return Promise.reject(new ApiError(NO_BUSINESS_MESSAGE, { code: "no_business" }));

    request.headers.set("X-App-Key", appKey);
    request.headers.set("X-Business", slug);
    request.headers.delete("Authorization");

    const current = tokens.get();
    if (current && slug === getSlug() && !pathOf(request.url).startsWith(AUTH_PATH)) {
      request.headers.set("Authorization", `Bearer ${current.accessToken}`);
      request.agendafluiToken = current.accessToken;
    }
    request.agendafluiSlug = slug;
    return request;
  });

  http.interceptors.response.use(
    (response) => response,
    async (failure) => {
      const request = failure && failure.config;
      const error = toApiError(failure);
      if (error.status !== 401 || !request) throw error;

      const onAuthRoute = pathOf(request.url).startsWith(AUTH_PATH);

      if (error.reason === "unknown_business") {
        if (request.agendafluiSlug === getSlug()) onBusinessGone();
        throw error;
      }

      const renewable =
        error.reason === "session_invalid" &&
        !onAuthRoute &&
        request.agendafluiToken !== undefined &&
        !request.agendafluiRetried;
      if (!renewable || request.agendafluiSlug !== getSlug()) throw error;

      const current = tokens.get();
      if (!current) throw sessionEnded();
      // Outra requisição já renovou enquanto esta voltava: só repete, sem gastar outro token de renovação.
      if (current.accessToken === request.agendafluiToken) await refresh(request.agendafluiSlug);

      request.agendafluiRetried = true;
      return http.request(request);
    }
  );

  return { http, refresh: (slug = getSlug()) => refresh(slug) };
}

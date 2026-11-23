import { createApiClient } from "../api/client";
import { getActiveSlug } from "../api";
import { config } from "../config";
import { createTokenStore, createSessionTokens } from "../session/tokenStore";
import { secureStorage } from "../session/secureStorage";

// Cliente da API da equipe: outra chave de tokens, outra rota de renovação. O token da equipe nunca vai
// para as rotas de visitante e de cliente (/availability, /business) nem para /me; o login sai sem loja.
export const staffTokenStore = createTokenStore(secureStorage, { key: "agendaflui.staffSession" });
export const staffSessionTokens = createSessionTokens(staffTokenStore, getActiveSlug);

const handlers = { onSessionEnded: () => {}, onBusinessGone: () => {} };
export function setStaffSessionHandlers(next) {
  if (typeof next.onSessionEnded === "function") handlers.onSessionEnded = next.onSessionEnded;
  if (typeof next.onBusinessGone === "function") handlers.onBusinessGone = next.onBusinessGone;
}

export const staffApi = createApiClient({
  baseURL: `${config.apiUrl}/v1`,
  getSlug: getActiveSlug,
  tokens: staffSessionTokens,
  authPrefix: "/auth/staff/",
  refreshPath: "/auth/staff/refresh",
  anonymousPaths: ["/availability", "/business"],
  noBusinessPaths: ["/auth/staff/login"],
  onSessionEnded: () => handlers.onSessionEnded(),
  onBusinessGone: () => handlers.onBusinessGone(),
});

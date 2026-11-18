import { createApiClient } from "./client";
import { config } from "../config";
import { createTokenStore, createSessionTokens } from "../session/tokenStore";
import { secureStorage } from "../session/secureStorage";

// Loja ativa: quem escolhe a loja (BusinessProvider) a define antes de qualquer requisição.
let activeSlug = null;
export function setActiveSlug(slug) {
  activeSlug = slug || null;
}
export function getActiveSlug() {
  return activeSlug;
}

const handlers = { onSessionEnded: () => {}, onBusinessGone: () => {} };
export function setSessionHandlers(next) {
  if (typeof next.onSessionEnded === "function") handlers.onSessionEnded = next.onSessionEnded;
  if (typeof next.onBusinessGone === "function") handlers.onBusinessGone = next.onBusinessGone;
}

export const tokenStore = createTokenStore(secureStorage);
export const sessionTokens = createSessionTokens(tokenStore, getActiveSlug);

export const api = createApiClient({
  baseURL: `${config.apiUrl}/v1`,
  appKey: config.appKey,
  getSlug: getActiveSlug,
  tokens: sessionTokens,
  onSessionEnded: () => handlers.onSessionEnded(),
  onBusinessGone: () => handlers.onBusinessGone(),
});

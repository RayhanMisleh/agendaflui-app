const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Depois do código: opcionalmente /pedidos/<id>, barra final, ?consulta ou #âncora.
const TAIL = "(?:/pedidos/([^/?#]+))?/?(?:[?#].*)?$";
const APP_LINK = new RegExp(`^agendaflui://loja/([^/?#]+)${TAIL}`, "i");
const WEB_LINK = new RegExp(`^https?://[^/?#]+/([^/?#]+)${TAIL}`, "i");
const PATH_LINK = new RegExp(`^/([^/?#]+)${TAIL}`);

export function normalizeSlug(text) {
  if (typeof text !== "string") return null;
  const slug = text.trim().toLowerCase();
  return SLUG.test(slug) ? slug : null;
}

// 'agendaflui://loja/<código>', 'https://<endereço>/<código>[/pedidos/<id>]' ou '/<código>[...]'.
export function parseStoreLink(url) {
  if (typeof url !== "string") return null;
  const text = url.trim();
  const match = APP_LINK.exec(text) || WEB_LINK.exec(text) || PATH_LINK.exec(text);
  if (!match) return null;
  const slug = normalizeSlug(match[1]);
  if (!slug) return null;
  if (match[2] === undefined) return { slug, orderId: null };
  return ORDER_ID.test(match[2]) ? { slug, orderId: match[2] } : null;
}

// 'select': ainda sem loja; 'confirm': link de outra loja (pede confirmação); 'none': nada a fazer.
export function decideStoreSwitch(currentSlug, incomingSlug) {
  if (!incomingSlug) return "none";
  if (!currentSlug) return "select";
  return currentSlug === incomingSlug ? "none" : "confirm";
}

// Web: depois de usar o `/<código>` do endereço, tira-o da barra (sem recarregar), para o link não ser lido de
// novo a cada recarga. Endereço de pedido (`/<código>/pedidos/<id>`) fica: quem o usa ainda precisa dele.
export function stripStoreFromAddress(win) {
  try {
    if (!win || !win.location || !win.history || typeof win.history.replaceState !== "function") return;
    const link = parseStoreLink(win.location.pathname);
    if (!link || link.orderId !== null) return;
    win.history.replaceState(null, "", `/${win.location.search || ""}${win.location.hash || ""}`);
  } catch (error) {
    // sem history: o link só será lido de novo no próximo carregamento
  }
}

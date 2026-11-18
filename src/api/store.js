import { api } from "./index";
import { ApiError } from "./errors";

// Loja do cliente na loja atual: catálogo, endereços, frete, pedido e pagamento. O app nunca manda preço,
// total nem frete calculado por ele: o servidor refaz os valores e o frete vem da cotação assinada.

const enc = encodeURIComponent;

function pageParams({ cursor, ...rest } = {}) {
  const params = {};
  for (const [name, value] of Object.entries(rest)) {
    if (value !== undefined && value !== null && value !== "") params[name] = value;
  }
  if (cursor) params.cursor = cursor;
  return params;
}

// Só o id e a quantidade de cada linha: nada de preço, nome ou imagem do carrinho.
function cleanLines(lines) {
  return (Array.isArray(lines) ? lines : []).map((line) => ({ productId: line.productId, quantity: line.quantity }));
}

function cleanDelivery(delivery) {
  if (delivery && delivery.method === "SHIPPING") {
    return { method: "SHIPPING", addressId: delivery.addressId, quoteToken: delivery.quoteToken };
  }
  return { method: "PICKUP" };
}

export async function listCategories() {
  const response = await api.http.get("/store/categories");
  return response.data.items;
}

// { items, nextCursor }
export async function listProducts({ categoryId, search, cursor } = {}) {
  const response = await api.http.get("/store/products", { params: pageParams({ categoryId, search, cursor }) });
  return { items: response.data.items, nextCursor: response.data.nextCursor || null };
}

export async function getProduct(id) {
  const response = await api.http.get(`/store/products/${enc(id)}`);
  return response.data;
}

// { pickup: { enabled, instructions }, shipping: { enabled }, payment: { available } }
export async function getStoreOptions() {
  const response = await api.http.get("/store/options");
  return response.data;
}

// { address, unavailable }: `unavailable` verdadeiro quer dizer que a pessoa digita o endereço todo.
export async function lookupPostalCode(cep) {
  const digits = String(cep || "").replace(/\D/g, "");
  if (digits.length !== 8) throw new ApiError("Digite o CEP com 8 números.", { code: "validation" });
  const response = await api.http.get(`/store/postal-codes/${digits}`);
  return response.data;
}

export async function listAddresses() {
  const response = await api.http.get("/me/addresses");
  return response.data.items;
}

function cleanAddress(a) {
  const out = {};
  if ("label" in a) out.label = a.label ? String(a.label).trim() || null : null;
  for (const name of ["recipientName", "street", "number", "district", "city"]) {
    if (a[name] !== undefined) out[name] = String(a[name]).trim();
  }
  if (a.postalCode !== undefined) out.postalCode = String(a.postalCode).replace(/\D/g, "");
  if ("complement" in a) out.complement = a.complement ? String(a.complement).trim() || null : null;
  if (a.state !== undefined) out.state = String(a.state).trim().toUpperCase();
  if (a.isDefault !== undefined) out.isDefault = Boolean(a.isDefault);
  return out;
}

export async function createAddress(address) {
  const response = await api.http.post("/me/addresses", cleanAddress(address));
  return response.data;
}

export async function updateAddress(id, address) {
  const response = await api.http.patch(`/me/addresses/${enc(id)}`, cleanAddress(address));
  return response.data;
}

export async function deleteAddress(id) {
  await api.http.delete(`/me/addresses/${enc(id)}`);
}

// { pickup, options: [{ serviceCode, name, carrier, priceCents, days, quoteToken }], shippingError }
// A cotação vale 30 minutos e é assinada: o pedido confere o `quoteToken`.
export async function quoteShipping({ addressId, lines }) {
  const response = await api.http.post("/store/shipping-quotes", { addressId, lines: cleanLines(lines) });
  return response.data;
}

// A mesma Idempotency-Key nas novas tentativas do mesmo pedido (ver createOrderSubmitter): sem ela um toque
// duplo ou uma queda de rede faria dois pedidos.
export async function createOrder({ lines, delivery, note } = {}, idempotencyKey) {
  if (typeof idempotencyKey !== "string" || idempotencyKey.trim() === "") {
    throw new ApiError("Não deu para fazer o pedido. Tente de novo.", { code: "idempotency_key_missing" });
  }
  const body = { lines: cleanLines(lines), delivery: cleanDelivery(delivery) };
  const text = typeof note === "string" ? note.trim() : "";
  if (text) body.note = text;
  const response = await api.http.post("/store/orders", body, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}

// { items, nextCursor }
export async function listOrders({ status, cursor } = {}) {
  const response = await api.http.get("/store/orders", { params: pageParams({ status, cursor }) });
  return { items: response.data.items, nextCursor: response.data.nextCursor || null };
}

export async function getOrder(id) {
  const response = await api.http.get(`/store/orders/${enc(id)}`);
  return response.data;
}

// Só pedido aguardando pagamento; o estoque reservado volta.
export async function cancelOrder(id, reason) {
  const text = typeof reason === "string" ? reason.trim() : "";
  const response = await api.http.post(`/store/orders/${enc(id)}/cancel`, text ? { reason: text } : {});
  return response.data;
}

// { checkoutUrl, expiresAt, expiresLabel }. Chamar de novo devolve o mesmo endereço.
// `returnUrl` só vale http(s) com a origem liberada na chave do app; no celular vai `null`.
export async function startCheckout(id, returnUrl) {
  const response = await api.http.post(`/store/orders/${enc(id)}/checkout`, returnUrl ? { returnUrl } : {});
  return response.data;
}

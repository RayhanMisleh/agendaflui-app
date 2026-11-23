import { api } from "./index";

// Fidelidade do cliente na loja atual. Os termos (pontos, clube) vêm da conta; o app não fixa nenhum.

// { balance, clubMember, terms }
export async function getMyLoyalty() {
  const response = await api.http.get("/loyalty/me");
  return response.data;
}

// Visitante também lê (a rota não exige login). O estoque não sai: cada prêmio traz `available`.
export async function listPrizes() {
  const response = await api.http.get("/loyalty/prizes");
  return response.data.items;
}

// Nasce pendente. A mesma chave nas novas tentativas do mesmo resgate (createIdempotencyKeys).
// `expectedCostPoints` é o custo que a pessoa viu: se mudou, a API recusa com 409 `changed`.
export async function redeemPrize({ prizeId, expectedCostPoints }, idempotencyKey) {
  const response = await api.http.post(
    "/loyalty/redemptions",
    { prizeId, expectedCostPoints },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  return response.data;
}

// { items, nextCursor }
export async function listRedemptions({ cursor } = {}) {
  const params = {};
  if (cursor) params.cursor = cursor;
  const response = await api.http.get("/loyalty/redemptions", { params });
  return { items: response.data.items, nextCursor: response.data.nextCursor || null };
}

// Só resgate pendente; os pontos e o estoque voltam.
export async function cancelRedemption(id) {
  const response = await api.http.post(`/loyalty/redemptions/${encodeURIComponent(id)}/cancel`);
  return response.data;
}

// { enabled, month, entries: [{ position, firstName, avatarUrl, points }] }
export async function getRanking() {
  const response = await api.http.get("/loyalty/ranking");
  return response.data;
}

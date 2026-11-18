// Regras de apresentação dos prêmios e dos resgates (sem rede).

// 'unavailable' (esgotado) | 'insufficient' (saldo menor que o custo) | 'available'.
// Sem saldo conhecido (visitante), o saldo é zero.
export function prizeState(prize, balance) {
  if (!prize.available) return "unavailable";
  if ((Number(balance) || 0) < prize.costPoints) return "insufficient";
  return "available";
}

export function missingPoints(prize, balance) {
  return Math.max(0, prize.costPoints - (Number(balance) || 0));
}

const STATUS_LABELS = { PENDING: "Retire no balcão", DELIVERED: "Entregue", CANCELED: "Cancelado" };

export function redemptionStatusLabel(status) {
  return STATUS_LABELS[status] || "";
}

// Tom do ponto de cor ao lado do texto da situação (a informação está no texto, nunca só na cor).
export function redemptionStatusTone(status) {
  return { PENDING: "warning", DELIVERED: "success", CANCELED: "neutral" }[status] || "neutral";
}

// Pontos que o atendimento rende: soma de `rewardPoints` dos serviços (o que faltar conta zero).
export function rewardPointsOf(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item && item.rewardPoints) || 0), 0);
}

import { newIdempotencyKey, isFinalRejection } from "../api/idempotency";
import { pointsLabel } from "../business/terms";

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

// "Ganha 10 pontos": na v1 todo cliente ganha pontos, sócio do clube ou não. Sem pontos no serviço, nada.
export function earnLabel(service, terms) {
  const points = Math.trunc(Number(service && service.rewardPoints)) || 0;
  return points > 0 ? `Ganha ${pointsLabel(points, terms)}` : null;
}

// Resgate de prêmio. A chave de repetição é aleatória e nasce por intenção: `begin` (quando a pessoa abre a
// confirmação) cria uma; a mesma intenção, no mesmo custo, repete a chave em qualquer reenvio (rede, 5xx, tempo
// esgotado). Sucesso, recusa do servidor (409 e outros 4xx) e desistência (`cancel`) descartam a intenção: o
// próximo resgate do mesmo prêmio é outro pedido, com chave nova. Um envio por vez por prêmio.
// `send({ prizeId, expectedCostPoints }, key)` é redeemPrize.
export function createPrizeRedeemer({ send, make = newIdempotencyKey }) {
  const intents = new Map(); // prizeId -> { cost, key, flight }

  function begin(prize) {
    const current = intents.get(prize.id);
    if (current && current.cost === prize.costPoints) return current.key;
    const intent = { cost: prize.costPoints, key: make(), flight: null };
    intents.set(prize.id, intent);
    return intent.key;
  }

  return {
    begin,
    // A pessoa desistiu antes de enviar: a próxima tentativa começa do zero.
    cancel(prize) {
      const current = intents.get(prize.id);
      if (current && !current.flight) intents.delete(prize.id);
    },
    redeem(prize) {
      begin(prize);
      const intent = intents.get(prize.id);
      if (intent.flight) return intent.flight;
      intent.flight = (async () => {
        try {
          const result = await send({ prizeId: prize.id, expectedCostPoints: prize.costPoints }, intent.key);
          if (intents.get(prize.id) === intent) intents.delete(prize.id);
          return result;
        } catch (error) {
          if (isFinalRejection(error) && intents.get(prize.id) === intent) intents.delete(prize.id);
          throw error;
        } finally {
          intent.flight = null;
        }
      })();
      return intent.flight;
    },
  };
}

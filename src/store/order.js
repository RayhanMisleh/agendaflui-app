import { createIdempotencyKeys, isFinalRejection } from "../api/idempotency";

export { formatCents } from "../utils/money";

// Chaves dos pedidos desta sessão do app: sobrevivem a trocar de tela, para a nova tentativa depois de uma
// queda de rede repetir a chave (e o servidor devolver o mesmo pedido em vez de fazer outro).
export const orderKeys = createIdempotencyKeys();

// Só id e quantidade: o servidor refaz o preço de cada linha.
export function toOrderLines(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({ productId: item.productId, quantity: item.quantity }));
}

// choice: { method: 'PICKUP' } ou { method: 'SHIPPING', addressId, quoteToken, ... }. O preço do frete nunca sai daqui.
export function buildDelivery(choice) {
  if (choice && choice.method === "PICKUP") return { method: "PICKUP" };
  if (choice && choice.method === "SHIPPING" && choice.addressId && choice.quoteToken) {
    return { method: "SHIPPING", addressId: choice.addressId, quoteToken: choice.quoteToken };
  }
  throw new Error("Escolha como receber o pedido.");
}

// Texto estável do que o pedido é: mesmas linhas (em qualquer ordem) e mesma entrega, mesma assinatura.
export function orderSignature(lines, delivery) {
  const parts = [...lines]
    .sort((a, b) => (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0))
    .map((line) => `${line.productId}x${line.quantity}`)
    .join(",");
  const where = delivery.method === "SHIPPING" ? `SHIPPING:${delivery.addressId}:${delivery.quoteToken}` : delivery.method;
  return `order|${parts}|${where}`;
}

// Para onde o Mercado Pago devolve a pessoa. Web: o pedido no app. Celular: nada (o app atualiza o pedido
// quando o navegador fecha); `agendaflui://` a API recusa.
export function checkoutReturnUrl({ platform, origin, slug, orderId }) {
  if (platform !== "web" || !origin || !slug || !orderId) return null;
  return `${String(origin).replace(/\/+$/, "")}/${slug}/pedidos/${orderId}`;
}

export function orderStatusLabel(order) {
  if (!order) return "";
  switch (order.status) {
    case "AWAITING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return { READY_FOR_PICKUP: "Pronto para retirar", SHIPPED: "Enviado", DELIVERED: "Entregue" }[order.fulfillmentStatus] || "Pago";
    case "CANCELED":
      return "Cancelado";
    case "EXPIRED":
      return "Prazo de pagamento vencido";
    default:
      return "";
  }
}

// Tom do ponto de cor ao lado da situação (a informação está no texto, nunca só na cor).
export function orderStatusTone(order) {
  switch (order && order.status) {
    case "PAID":
      return "success";
    case "AWAITING_PAYMENT":
      return "warning";
    default:
      return "neutral";
  }
}

// Envia o pedido: um por vez (o segundo toque recebe a resposta do primeiro) e com a chave da assinatura.
// A mesma assinatura repete a chave depois de falha de rede ou 5xx; recusa do servidor ou sucesso descartam a chave.
// `send(body, key)` é createOrder.
export function createOrderSubmitter({ send, keys = orderKeys }) {
  let inFlight = null;
  return {
    isSending: () => inFlight !== null,
    submit({ lines, delivery, note }) {
      const signature = orderSignature(lines, delivery);
      if (inFlight) {
        if (inFlight.signature === signature) return inFlight.promise;
        return Promise.reject(new Error("Outro pedido está sendo enviado."));
      }
      const key = keys.keyFor(signature);
      const promise = (async () => {
        try {
          const order = await send({ lines, delivery, note }, key);
          keys.done(signature);
          return order;
        } catch (error) {
          if (isFinalRejection(error)) keys.done(signature);
          throw error;
        } finally {
          inFlight = null;
        }
      })();
      inFlight = { signature, promise };
      return promise;
    },
  };
}

export function formatCep(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

// 'Rua A, 10, apto 2 - Centro, Curitiba/PR - CEP 80010-000' (endereço do cadastro ou do pedido).
export function addressLine(address) {
  if (!address) return "";
  const street = [address.street, address.number, address.complement].filter(Boolean).join(", ");
  const city = [address.city, address.state].filter(Boolean).join("/");
  const where = [street, [address.district, city].filter(Boolean).join(", ")].filter(Boolean).join(" - ");
  return address.postalCode ? `${where} - CEP ${formatCep(address.postalCode)}` : where;
}

export function shippingDaysLabel(days) {
  const n = Math.trunc(Number(days)) || 0;
  if (n <= 0) return "Prazo a combinar";
  return n === 1 ? "Chega em 1 dia útil" : `Chega em ${n} dias úteis`;
}

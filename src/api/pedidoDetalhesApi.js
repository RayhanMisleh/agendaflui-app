import api from "./apiConfig";

/**
 * Busca os detalhes de um pedido específico
 */
export const getPedidoDetalhes = async (pedidoId) => {
  try {
    const response = await api.get(`/pedidos/${pedidoId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erro ao carregar detalhes do pedido");
  }
};

/**
 * Formata o status do pedido para exibição
 */
export const formatarStatusPedido = (status) => {
  const statusMap = {
    PENDENTE: { text: "Pendente", color: "#f59e0b", icon: "schedule" },
    CONFIRMADO: { text: "Confirmado", color: "#3b82f6", icon: "check-circle" },
    PREPARANDO: { text: "Preparando", color: "#0B6E66", icon: "inventory" },
    CONCLUIDO: { text: "Concluído", color: "#10b981", icon: "check-circle" },
    CONCLUÍDO: { text: "Concluído", color: "#10b981", icon: "check-circle" },
    SAIU_ENTREGA: { text: "Em Rota", color: "#06b6d4", icon: "local-shipping" },
    ENVIADO: { text: "Enviado", color: "#3b82f6", icon: "local-shipping" },
    ENTREGUE: { text: "Entregue", color: "#10b981", icon: "done-all" },
    CANCELADO: { text: "Cancelado", color: "#ef4444", icon: "cancel" },
  };
  return statusMap[status] || { text: status || "Pendente", color: "#6b7280", icon: "info" };
};

/**
 * Formata o status de entrega para exibição
 */
export const formatarStatusEntrega = (statusEntrega) => {
  const statusMap = {
    PENDENTE: { text: "Pendente", color: "#f59e0b", icon: "schedule" },
    PREPARANDO: { text: "Preparando Envio", color: "#0B6E66", icon: "inventory" },
    ENVIADO: { text: "Enviado", color: "#3b82f6", icon: "local-shipping" },
    SAIU_ENTREGA: { text: "Em Rota de Entrega", color: "#3b82f6", icon: "local-shipping" },
    ENTREGUE: { text: "Entregue", color: "#10b981", icon: "done-all" },
    CANCELADO: { text: "Cancelado", color: "#ef4444", icon: "cancel" },
  };
  return statusMap[statusEntrega] || { text: statusEntrega || "Pendente", color: "#3b82f6", icon: "local-shipping" };
};

/**
 * Formata o status de pagamento para exibição
 */
export const formatarStatusPagamento = (statusPagamento) => {
  const statusMap = {
    PENDING: { text: "Pendente", color: "#f59e0b", icon: "schedule", needsPayment: true },
    PENDENTE: { text: "Pendente", color: "#f59e0b", icon: "schedule", needsPayment: true },
    APPROVED: { text: "Aprovado", color: "#10b981", icon: "check-circle", needsPayment: false },
    APROVADO: { text: "Aprovado", color: "#10b981", icon: "check-circle", needsPayment: false },
    PAID: { text: "Aprovado", color: "#10b981", icon: "check-circle", needsPayment: false },
    AUTHORIZED: { text: "Autorizado", color: "#3b82f6", icon: "verified", needsPayment: false },
    IN_PROCESS: { text: "Em Processamento", color: "#0B6E66", icon: "autorenew", needsPayment: false },
    REJECTED: { text: "Recusado", color: "#ef4444", icon: "cancel", needsPayment: true },
    CANCELLED: { text: "Cancelado", color: "#ef4444", icon: "cancel", needsPayment: false },
    CANCELADO: { text: "Cancelado", color: "#ef4444", icon: "cancel", needsPayment: false },
    REFUNDED: { text: "Reembolsado", color: "#06b6d4", icon: "replay", needsPayment: false },
  };
  return statusMap[statusPagamento] || { text: statusPagamento || "Pendente", color: "#6b7280", icon: "info", needsPayment: false };
};

/**
 * Calcula o total do pedido
 */
export const calcularTotalPedido = (pedido) => {
  if (!pedido) return 0;
  const totalProdutos =
    pedido.pedido_product?.reduce((total, item) => {
      const promo = Number(item.product?.promotional_price);
      const normal = Number(item.product?.product_price) || 0;
      const price = promo && promo > 0 && promo < normal ? promo : normal;
      const qty = Number(item.pedido_product_quantity) || 1;
      return total + price * qty;
    }, 0) || 0;

  const taxaEntrega = Number(pedido.taxa_entrega) || 0;
  return totalProdutos + taxaEntrega;
};

/**
 * Cancela um pedido pelo próprio usuário
 */
export const cancelarPedido = async (pedidoId) => {
  try {
    const response = await api.put(`/pedidos/${pedidoId}/cancel`);
    return response.data;
  } catch (error) {
    const msg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Erro ao cancelar pedido";
    throw new Error(msg);
  }
};

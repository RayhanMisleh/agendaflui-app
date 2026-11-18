import api from "./apiConfig";

/**
 * Calcula o frete para um pedido
 */
export const calcularFrete = async (destinationCEP, invoiceValue, products) => {
  try {
    const payload = {
      destinationCEP,
      invoiceValue,
      products,
    };

    const response = await api.post("/frete/calcular", payload);

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Erro ao calcular frete");
  }
};

/**
 * Formata o preço do frete para exibição
 */
export const formatFretePrice = (price) => {
  const numericPrice = parseFloat(price);
  if (numericPrice === 0 || isNaN(numericPrice) || price === null) {
    return "Grátis";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericPrice);
};

/**
 * Formata o prazo de entrega
 */
export const formatDeliveryTime = (days) => {
  if (days === 1) {
    return "1 dia útil";
  }
  return `${days} dias úteis`;
};

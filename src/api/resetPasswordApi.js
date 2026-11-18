import api from "./apiConfig";

/**
 * Altera a senha do usuário logado
 * @param {string} newPassword - Nova senha do usuário
 * @returns {Promise} Response da API
 */
export const changePassword = async (newPassword) => {
  try {
    console.log("🔑 [DEBUG] PUT /reset-password - Alterando senha");

    const response = await api.put("/reset-password", {
      user_password: newPassword,
    });

    console.log("📥 [DEBUG] PUT /reset-password - Resposta:", {
      status: response.status,
      message: response.data?.message,
      user: response.data?.user?.user_name,
    });

    return response.data;
  } catch (error) {
    console.log("❌ [DEBUG] PUT /reset-password - Erro:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Melhorar mensagens de erro específicas
    let errorMessage = "Erro ao alterar senha";

    if (error.response?.status === 401) {
      errorMessage = "Não autorizado. Faça login novamente.";
    } else if (error.response?.status === 400) {
      errorMessage = "Senha inválida. A senha deve ter pelo menos 6 caracteres.";
    } else if (error.response?.status >= 500) {
      errorMessage = "Erro interno do servidor. Tente novamente em alguns minutos.";
    } else if (error.message === "Network Error") {
      errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

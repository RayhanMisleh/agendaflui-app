import api from "./apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// O que o perfil, a exclusão de conta e os seletores da loja ainda importam; a Tarefa 4 e a 6 trocam por /v1/me.
// A entrada (login, cadastro, código, senha) vive em ./auth.js e a sessão no SecureStore.

// Apaga os dados do usuário guardados pelas telas antigas.
export const logout = async () => {
  await AsyncStorage.multiRemove(["user_id", "user_name", "user_email"]);
  return true;
};

export const getUserId = async () => {
  const userId = await AsyncStorage.getItem("user_id");
  return userId ? parseInt(userId, 10) : null;
};

export const getUserEmail = async () => AsyncStorage.getItem("user_email");

function errorText(error, fallback) {
  return (error && error.message) || fallback;
}

// Função para solicitar exclusão de conta
export const requestDeleteAccount = async () => {
  try {
    const response = await api.post("/excluir-conta", {});
    Toast.show({
      type: "success",
      text1: "Código enviado",
      text2: "Veja seu e-mail para confirmar a exclusão da conta.",
      visibilityTime: 4000,
    });
    return response.data;
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Não deu para pedir a exclusão",
      text2: errorText(error, "Tente de novo em instantes."),
      visibilityTime: 4000,
    });
    throw error;
  }
};

// Função para confirmar exclusão de conta
export const confirmDeleteAccount = async (code) => {
  try {
    const response = await api.post("/confirmar-exclusao-conta", { code: code.toString() });
    Toast.show({
      type: "success",
      text1: "Conta excluída",
      text2: "Sua conta foi excluída.",
      visibilityTime: 4000,
    });
    return response.data;
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Não deu para excluir a conta",
      text2: errorText(error, "Tente de novo em instantes."),
      visibilityTime: 4000,
    });
    throw error;
  }
};

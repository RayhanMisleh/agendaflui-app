import AsyncStorage from "@react-native-async-storage/async-storage";

// O que os seletores da loja (endereço e pagamento) ainda importam; a Tarefa 6 troca por /v1/me/addresses.
// A entrada vive em ./auth.js, o perfil em ./me.js e a sessão no SecureStore.

export const getUserId = async () => {
  const userId = await AsyncStorage.getItem("user_id");
  return userId ? parseInt(userId, 10) : null;
};

export const getUserEmail = async () => AsyncStorage.getItem("user_email");

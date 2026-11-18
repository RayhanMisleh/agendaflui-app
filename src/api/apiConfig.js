import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../utils/config";

// Criar instância do axios
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token automaticamente nas requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // segue sem token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com respostas e erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem("auth_token");
    }

    // Replace technical messages with user-friendly generic messages
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      error.message = "Tempo de conexão esgotado. Verifique sua internet e tente novamente.";
    } else if (error.message === 'Network Error' || !error.response) {
      error.message = "Falha na rede. Verifique sua conexão com a internet.";
    }

    return Promise.reject(error);
  }
);

export default api;

// Funções do app antigo que as seções movidas (prêmios, saldo, banners, ranking) e MinhaJornada ainda usam.
// A Tarefa 5 troca tudo por /v1/loyalty e /v1/banners e apaga este arquivo.
import api from "./apiConfig";

export const getProfile = async () => {
  const { data } = await api.get("/user/profile");
  return data;
};

export const getPrizes = async () => {
  const { data } = await api.get("/prizes");
  return data;
};

export const redeemPrize = async (prizeId) => {
  const { data } = await api.post(`/prizes/${prizeId}/redeem`);
  return data;
};

export const getMyRedemptions = async () => {
  const { data } = await api.get("/users/me/redemptions");
  return data;
};

export const getBanners = async () => {
  const { data } = await api.get("/banners");
  return data;
};

export const getRanking = async () => {
  const { data } = await api.get("/users/ranking");
  return data;
};


// Configurações da aplicação
// A URL da API vem do build (EXPO_PUBLIC_API_URL); sem ela, vale a de produção.
const API_PRODUCTION_URL = "https://api.agendaflui.com.br";

export const config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || API_PRODUCTION_URL,
  APP_NAME: "Agenda Flui",
  BRAND_URL: "https://agendaflui.com.br",
  PRIVACY_POLICY_URL: "https://agendaflui.com.br/privacidade/",
  TERMS_OF_USE_URL: "https://agendaflui.com.br/termos/",
  SUPPORT_URL: "https://agendaflui.com.br/contato/",
};

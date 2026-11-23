// Configuração do build: endereço da API por EXPO_PUBLIC_API_URL (EAS ou .env); padrão é a de produção.
const DEFAULT_API_URL = "https://api.agendaflui.com.br";
const SITE_URL = "https://agendaflui.com.br";

const DEFAULT_PAINEL_URL = "https://painel.agendaflui.com.br";

// Só endereço https vale; vazio ou outro esquema some (o botão não aparece).
const httpsUrl = (value) => {
  const url = (value || "").trim();
  return /^https:\/\/\S+$/i.test(url) ? url : null;
};

export function readConfig(env = {}) {
  const apiUrl = (env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/+$/, "") || DEFAULT_API_URL;
  return {
    apiUrl,
    siteUrl: SITE_URL,
    privacyUrl: `${SITE_URL}/privacidade`,
    termsUrl: `${SITE_URL}/termos`,
    scheme: "agendaflui",
    appStoreUrl: httpsUrl(env.EXPO_PUBLIC_APP_STORE_URL),
    playStoreUrl: httpsUrl(env.EXPO_PUBLIC_PLAY_STORE_URL),
    painelUrl: httpsUrl((env.EXPO_PUBLIC_PAINEL_URL || "").trim().replace(/\/+$/, "")) || DEFAULT_PAINEL_URL,
  };
}

// As variáveis são citadas por extenso: o Expo só troca `process.env.EXPO_PUBLIC_*` escrito assim.
export const config = readConfig({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_STORE_URL: process.env.EXPO_PUBLIC_APP_STORE_URL,
  EXPO_PUBLIC_PLAY_STORE_URL: process.env.EXPO_PUBLIC_PLAY_STORE_URL,
  EXPO_PUBLIC_PAINEL_URL: process.env.EXPO_PUBLIC_PAINEL_URL,
});

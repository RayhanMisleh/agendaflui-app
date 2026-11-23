// Configuração do build: endereço da API por EXPO_PUBLIC_API_URL (EAS ou .env); padrão é a de produção.
const DEFAULT_API_URL = "https://api.agendaflui.com.br";
const SITE_URL = "https://agendaflui.com.br";

export function readConfig(env = {}) {
  const apiUrl = (env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/+$/, "") || DEFAULT_API_URL;
  return {
    apiUrl,
    siteUrl: SITE_URL,
    privacyUrl: `${SITE_URL}/privacidade`,
    termsUrl: `${SITE_URL}/termos`,
    scheme: "agendaflui",
  };
}

// As variáveis são citadas por extenso: o Expo só troca `process.env.EXPO_PUBLIC_*` escrito assim.
export const config = readConfig({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

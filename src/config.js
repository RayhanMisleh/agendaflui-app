// Configuração do build. A chave da plataforma vem de EXPO_PUBLIC_APP_KEY (EAS ou .env), nunca do código.
const DEFAULT_API_URL = "https://api.agendaflui.com.br";
const SITE_URL = "https://agendaflui.com.br";

export function readConfig(env = {}) {
  const apiUrl = (env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/+$/, "") || DEFAULT_API_URL;
  const appKey = (env.EXPO_PUBLIC_APP_KEY || "").trim();
  return {
    apiUrl,
    appKey,
    appKeyMissing: appKey === "",
    siteUrl: SITE_URL,
    privacyUrl: `${SITE_URL}/privacidade`,
    termsUrl: `${SITE_URL}/termos`,
    scheme: "agendaflui",
  };
}

// As variáveis são citadas por extenso: o Expo só troca `process.env.EXPO_PUBLIC_*` escrito assim.
export const config = readConfig({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_KEY: process.env.EXPO_PUBLIC_APP_KEY,
});

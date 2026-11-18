import { readConfig } from "../../src/config";

describe("readConfig", () => {
  test("sem variáveis: API de produção e chave ausente", () => {
    const c = readConfig({});
    expect(c.apiUrl).toBe("https://api.agendaflui.com.br");
    expect(c.appKey).toBe("");
    expect(c.appKeyMissing).toBe(true);
    expect(c.siteUrl).toBe("https://agendaflui.com.br");
    expect(c.privacyUrl).toBe("https://agendaflui.com.br/privacidade");
    expect(c.termsUrl).toBe("https://agendaflui.com.br/termos");
    expect(c.scheme).toBe("agendaflui");
  });

  test("URL da API sem barra final", () => {
    expect(readConfig({ EXPO_PUBLIC_API_URL: "https://x.test/" }).apiUrl).toBe("https://x.test");
    expect(readConfig({ EXPO_PUBLIC_API_URL: "https://x.test///" }).apiUrl).toBe("https://x.test");
  });

  test("URL da API em branco volta à de produção", () => {
    expect(readConfig({ EXPO_PUBLIC_API_URL: "  " }).apiUrl).toBe("https://api.agendaflui.com.br");
  });

  test("chave da plataforma vem só da variável", () => {
    const c = readConfig({ EXPO_PUBLIC_APP_KEY: " chave-de-teste " });
    expect(c.appKey).toBe("chave-de-teste");
    expect(c.appKeyMissing).toBe(false);
  });
});

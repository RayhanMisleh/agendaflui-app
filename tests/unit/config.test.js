import { readConfig } from "../../src/config";

describe("readConfig", () => {
  test("sem variáveis: API de produção", () => {
    const c = readConfig({});
    expect(c.apiUrl).toBe("https://api.agendaflui.com.br");
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
});

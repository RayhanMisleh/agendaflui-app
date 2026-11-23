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

describe("readConfig: lojas de aplicativos e painel", () => {
  test("URLs das lojas de aplicativos: https vira o valor; vazio ou http vira null", () => {
    expect(readConfig({}).appStoreUrl).toBeNull();
    expect(readConfig({}).playStoreUrl).toBeNull();
    const ok = readConfig({
      EXPO_PUBLIC_APP_STORE_URL: " https://apps.apple.com/br/app/x/id1 ",
      EXPO_PUBLIC_PLAY_STORE_URL: "https://play.google.com/store/apps/details?id=com.agendaflui.app",
    });
    expect(ok.appStoreUrl).toBe("https://apps.apple.com/br/app/x/id1");
    expect(ok.playStoreUrl).toBe("https://play.google.com/store/apps/details?id=com.agendaflui.app");
    const bad = readConfig({ EXPO_PUBLIC_APP_STORE_URL: "http://apps.apple.com/x", EXPO_PUBLIC_PLAY_STORE_URL: "  " });
    expect(bad.appStoreUrl).toBeNull();
    expect(bad.playStoreUrl).toBeNull();
    expect(readConfig({ EXPO_PUBLIC_APP_STORE_URL: "javascript:alert(1)" }).appStoreUrl).toBeNull();
  });

  test("painelUrl: padrão painel.agendaflui.com.br, sem barra no fim", () => {
    expect(readConfig({}).painelUrl).toBe("https://painel.agendaflui.com.br");
    expect(readConfig({ EXPO_PUBLIC_PAINEL_URL: "https://p.test//" }).painelUrl).toBe("https://p.test");
    expect(readConfig({ EXPO_PUBLIC_PAINEL_URL: " " }).painelUrl).toBe("https://painel.agendaflui.com.br");
  });
});

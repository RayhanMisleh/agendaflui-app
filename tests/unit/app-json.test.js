const appJson = require("../../app.json");

describe("app.json: link https da loja abre o app", () => {
  test("iOS associa o domínio do app web", () => {
    expect(appJson.expo.ios.associatedDomains).toEqual(["applinks:app.agendaflui.com.br"]);
  });

  test("Android confere o domínio (autoVerify) para https://app.agendaflui.com.br", () => {
    expect(appJson.expo.android.intentFilters).toEqual([
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "app.agendaflui.com.br" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ]);
  });
});

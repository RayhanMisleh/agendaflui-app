const { wellKnownFiles } = require("../../scripts/well-known");
const fs = require("fs");
const path = require("path");

const FP1 = Array.from({ length: 32 }, (_, i) => (i * 7 % 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
const FP2 = Array.from({ length: 32 }, (_, i) => ((i * 11 + 3) % 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
const find = (files, p) => files.find((f) => f.path === p);

describe("wellKnownFiles", () => {
  test("sem variáveis: nenhum arquivo", () => {
    expect(wellKnownFiles({})).toEqual([]);
    expect(wellKnownFiles({ APPLE_TEAM_ID: "", ANDROID_CERT_SHA256: "  " })).toEqual([]);
  });

  test("team id válido gera o AASA com o appID e sem abrir /.well-known no app", () => {
    const files = wellKnownFiles({ APPLE_TEAM_ID: "ABCDE12345" });
    expect(files.map((f) => f.path)).toEqual([".well-known/apple-app-site-association"]);
    expect(JSON.parse(files[0].content)).toEqual({
      applinks: {
        details: [
          {
            appIDs: ["ABCDE12345.com.agendaflui.app"],
            components: [{ "/": "/.well-known/*", exclude: true }, { "/": "/*" }],
          },
        ],
      },
    });
  });

  test("impressões válidas geram assetlinks com o pacote com.agendaflui.app", () => {
    const files = wellKnownFiles({ ANDROID_CERT_SHA256: ` ${FP1}, ${FP2} ` });
    expect(files.map((f) => f.path)).toEqual([".well-known/assetlinks.json"]);
    expect(JSON.parse(files[0].content)).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: "com.agendaflui.app", sha256_cert_fingerprints: [FP1, FP2] },
      },
    ]);
  });

  test("as duas variáveis geram os dois arquivos", () => {
    const files = wellKnownFiles({ APPLE_TEAM_ID: "ABCDE12345", ANDROID_CERT_SHA256: FP1 });
    expect(find(files, ".well-known/apple-app-site-association")).toBeTruthy();
    expect(find(files, ".well-known/assetlinks.json")).toBeTruthy();
  });

  test("team id ou impressão inválidos: erro citando a variável e não o valor", () => {
    expect(() => wellKnownFiles({ APPLE_TEAM_ID: "abc-123" })).toThrow(/APPLE_TEAM_ID/);
    try {
      wellKnownFiles({ APPLE_TEAM_ID: "abc-123" });
    } catch (e) {
      expect(e.message).not.toContain("abc-123");
    }
    expect(() => wellKnownFiles({ ANDROID_CERT_SHA256: "AA:BB" })).toThrow(/ANDROID_CERT_SHA256/);
    try {
      wellKnownFiles({ ANDROID_CERT_SHA256: `${FP1},AA:BB:SEGREDO` });
    } catch (e) {
      expect(e.message).not.toContain("SEGREDO");
      expect(e.message).not.toContain(FP1);
    }
  });
});

describe(".htaccess", () => {
  const text = fs.readFileSync(path.join(__dirname, "..", "..", "public", ".htaccess"), "utf8");

  test("serve o AASA e o assetlinks como JSON sem cache", () => {
    expect(text).toMatch(/<Files "apple-app-site-association">[\s\S]*?ForceType application\/json[\s\S]*?<\/Files>/);
    expect(text).toMatch(/<FilesMatch "\^\(apple-app-site-association\|assetlinks\\\.json\)\$">[\s\S]*?no-cache/);
  });

  test("não reescreve /.well-known para o index.html", () => {
    const wk = text.indexOf("RewriteRule ^\\.well-known/ - [R=404,L]");
    const fallback = text.indexOf("RewriteRule ^ index.html [L]");
    expect(wk).toBeGreaterThan(-1);
    expect(wk).toBeLessThan(fallback);
  });
});

describe("wellKnownFiles: impressão em minúsculas", () => {
  test("grava a impressão em maiúsculas", () => {
    const { wellKnownFiles: build } = require("../../scripts/well-known");
    const lower = "ab:cd:ef:01:23:45:67:89:ab:cd:ef:01:23:45:67:89:ab:cd:ef:01:23:45:67:89:ab:cd:ef:01:23:45:67:89";
    const files = build({ ANDROID_CERT_SHA256: lower });
    expect(JSON.parse(files[0].content)[0].target.sha256_cert_fingerprints).toEqual([lower.toUpperCase()]);
  });
});

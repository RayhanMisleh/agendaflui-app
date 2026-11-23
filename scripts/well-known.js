// Arquivos de associação para o link https abrir o app instalado (iOS e Android).
// Valores vêm do ambiente do build: APPLE_TEAM_ID e ANDROID_CERT_SHA256. Sem a variável, o arquivo não é gerado.
const BUNDLE_ID = "com.agendaflui.app";
const TEAM_ID = /^[A-Z0-9]{10}$/;
const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i;

const clean = (value) => (typeof value === "string" ? value.trim() : "");

function wellKnownFiles(env = {}) {
  const files = [];

  const team = clean(env.APPLE_TEAM_ID);
  if (team) {
    if (!TEAM_ID.test(team)) {
      throw new Error("APPLE_TEAM_ID inválido: use o ID do time Apple, 10 caracteres de A-Z e 0-9.");
    }
    files.push({
      path: ".well-known/apple-app-site-association",
      content: JSON.stringify(
        {
          applinks: {
            details: [
              {
                appIDs: [`${team}.${BUNDLE_ID}`],
                components: [{ "/": "/.well-known/*", exclude: true }, { "/": "/*" }],
              },
            ],
          },
        },
        null,
        2
      ),
    });
  }

  const raw = clean(env.ANDROID_CERT_SHA256);
  if (raw) {
    const prints = raw.split(",").map((p) => p.trim());
    if (!prints.every((p) => FINGERPRINT.test(p))) {
      throw new Error(
        "ANDROID_CERT_SHA256 inválido: use uma ou mais impressões SHA-256 separadas por vírgula, cada uma com 32 pares hexadecimais separados por dois-pontos."
      );
    }
    files.push({
      path: ".well-known/assetlinks.json",
      content: JSON.stringify(
        [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: BUNDLE_ID, sha256_cert_fingerprints: prints },
          },
        ],
        null,
        2
      ),
    });
  }

  return files;
}

module.exports = { wellKnownFiles };

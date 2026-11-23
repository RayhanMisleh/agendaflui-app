// Gera a versão web para a Hostinger: `npx expo export --platform web` e um zip pronto para subir.
// A chave vem de EXPO_PUBLIC_APP_KEY (no terminal ou no .env, que não vai para o repositório); sem ela, para.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { load } = require("@expo/env");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "dist", "web");
const zipFile = path.join(root, "dist", "agendaflui-web.zip");

load(root, { silent: true });
if (!(process.env.EXPO_PUBLIC_APP_KEY || "").trim()) {
  console.error("Falta EXPO_PUBLIC_APP_KEY: ponha a chave de plataforma no .env (veja .env.example) e rode de novo.");
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
execFileSync("npx", ["expo", "export", "--platform", "web", "--output-dir", "dist/web", "--clear"], { cwd: root, stdio: "inherit" });

if (!fs.existsSync(path.join(outDir, ".htaccess"))) {
  console.error("O export não copiou public/.htaccess; confira a pasta public/.");
  process.exit(1);
}

fs.rmSync(zipFile, { force: true });
execFileSync("zip", ["-qr", zipFile, ".", "-x", "metadata.json", "-x", ".DS_Store"], { cwd: outDir, stdio: "inherit" });
console.log(`Pronto: ${path.relative(root, zipFile)}. Suba o conteúdo em public_html do subdomínio (veja docs/PUBLICACAO-WEB.md).`);

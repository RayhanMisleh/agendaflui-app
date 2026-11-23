// Gera a versão web para a Hostinger: `npx expo export --platform web` e um zip pronto para subir.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { wellKnownFiles } = require("./well-known");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "dist", "web");
const zipFile = path.join(root, "dist", "agendaflui-web.zip");

fs.rmSync(outDir, { recursive: true, force: true });
execFileSync("npx", ["expo", "export", "--platform", "web", "--output-dir", "dist/web", "--clear"], { cwd: root, stdio: "inherit" });

if (!fs.existsSync(path.join(outDir, ".htaccess"))) {
  console.error("O export não copiou public/.htaccess; confira a pasta public/.");
  process.exit(1);
}

// Link https que abre o app instalado: só com APPLE_TEAM_ID e ANDROID_CERT_SHA256; valor inválido para o script.
let associationFiles;
try {
  associationFiles = wellKnownFiles(process.env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
for (const file of associationFiles) {
  const target = path.join(outDir, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${file.content}\n`);
}

fs.rmSync(zipFile, { force: true });
execFileSync("zip", ["-qr", zipFile, ".", "-x", "metadata.json", "-x", ".DS_Store"], { cwd: outDir, stdio: "inherit" });
console.log(`Pronto: ${path.relative(root, zipFile)}. Suba o conteúdo em public_html do subdomínio (veja docs/PUBLICACAO-WEB.md).`);

import fs from "fs";
import path from "path";

const root = path.join(__dirname, "..", "..");
const OLD = /sans|sejasans|barber|barbeiro|barbearia|coin|6200ea|7c4dff|5000c9|youtube|whatsapp|wa\.me|voucher/i;
const TEXT_EXT = /\.(js|jsx|json|css|html|md|txt)$/;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

const exists = (p) => fs.existsSync(path.join(root, p));

// Linhas com termo antigo; "sans-serif" é a única exceção permitida.
const offenders = (file) => {
  const rel = path.relative(root, file);
  const hits = [];
  fs.readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (OLD.test(line.replace(/sans-serif/gi, ""))) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  return hits;
};

describe("termos antigos", () => {
  test("README e AGENTS descrevem o AgendaFlui e não apontam para ../site", () => {
    for (const f of ["README.md", "AGENTS.md"]) {
      const text = fs.readFileSync(path.join(root, f), "utf8");
      expect(text).not.toContain("../site");
      expect(text).toMatch(/agendaflui/i);
    }
    expect(fs.readFileSync(path.join(root, "README.md"), "utf8")).toContain("EXPO_PUBLIC_APP_KEY");
  });

  test("nenhum termo antigo no código, na configuração e nos nomes dos assets", () => {
    const files = [
      "App.js", "index.js", "app.json", "eas.json", "package.json", "README.md", "AGENTS.md",
    ].filter(exists).map((f) => path.join(root, f));
    if (exists("src")) {
      files.push(...walk(path.join(root, "src")).filter((f) => TEXT_EXT.test(f)));
    }

    const hits = files.flatMap(offenders);
    if (exists("assets")) {
      for (const f of walk(path.join(root, "assets"))) {
        if (OLD.test(path.basename(f).replace(/sans-serif/gi, ""))) {
          hits.push(`${path.relative(root, f)}: nome do arquivo`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

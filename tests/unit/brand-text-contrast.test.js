import fs from "fs";
import path from "path";

const src = path.join(__dirname, "..", "..", "src");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });

// A cor da loja (brandStrong, primary) não garante contraste como texto; texto e rótulo usam brandText.
const USES = [
  /\bcolor:\s*[^,}\n]*\.(primary|brandStrong)\b/,
  /\bcolor\s*=\s*\{[^}\n]*\.(primary|brandStrong)\b/,
  /\bconst color = [^;\n]*\.(primary|brandStrong)\b/,
  /TintColor:\s*[^,}\n]*\.(primary|brandStrong)\b/,
];

describe("cor da loja como texto", () => {
  test("nenhum texto, ícone ou rótulo de aba usa brandStrong ou primary", () => {
    const hits = [];
    walk(src)
      .filter((f) => f.endsWith(".js"))
      .forEach((file) => {
        fs.readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (!/LoadingScreen|^\s*<ActivityIndicator/.test(line) && USES.some((re) => re.test(line))) hits.push(`${path.relative(src, file)}:${i + 1}: ${line.trim()}`);
          });
      });
    expect(hits).toEqual([]);
  });
});

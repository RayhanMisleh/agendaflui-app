import fs from "fs";
import path from "path";

describe("App.js: provedores", () => {
  test("BusinessProvider monta uma vez só (sem outro no ramo das fontes)", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "..", "App.js"), "utf8");
    expect(source.match(/<BusinessProvider>/g)).toHaveLength(1);
  });
});

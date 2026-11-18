import { clearLegacyStorage, LEGACY_KEYS } from "../../src/session/legacy";
import { memoryStorage } from "../helpers/memory-storage";

describe("clearLegacyStorage", () => {
  const legacy = { auth_token: "t", user_id: "1", user_name: "Ana", user_email: "a@x.com", "@voucher_cart_items": "[]" };
  const keep = { "agendaflui.business": "{}", themeMode: "dark", "@cart_items": "[]", "agendaflui.pushToken": "ExponentPushToken[x]" };

  test("apaga as chaves do app antigo e deixa as do app novo", async () => {
    const storage = memoryStorage({ ...legacy, ...keep });
    await clearLegacyStorage(storage);
    const left = storage.dump();
    for (const key of Object.keys(legacy)) expect(left[key]).toBeUndefined();
    for (const [key, value] of Object.entries(keep)) expect(left[key]).toBe(value);
  });

  test("lista cobre token, usuário e carrinho de voucher", () => {
    expect(LEGACY_KEYS).toEqual(expect.arrayContaining(["auth_token", "user_id", "user_name", "user_email", "@voucher_cart_items"]));
  });

  test("só limpa uma vez: depois de marcada, não mexe mais no armazenamento", async () => {
    const storage = memoryStorage({ ...legacy });
    await clearLegacyStorage(storage);
    await storage.setItem("user_name", "voltou");
    await clearLegacyStorage(storage);
    expect(storage.dump().user_name).toBe("voltou");
  });

  test("falha do armazenamento não lança", async () => {
    const broken = { getItem: async () => { throw new Error("x"); }, setItem: async () => { throw new Error("x"); }, removeItem: async () => { throw new Error("x"); } };
    await expect(clearLegacyStorage(broken)).resolves.toBeUndefined();
  });
});

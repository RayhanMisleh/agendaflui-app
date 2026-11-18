import { createCart, clearCartFor, cartKey } from "../../src/services/cartService";
import { memoryStorage } from "../helpers/memory-storage";

const racao = { id: "p1", name: "Ração", finalPriceCents: 1990, maxQuantity: 3, images: [{ url: "https://img.test/p1.png" }] };
const brinquedo = { id: "p2", name: "Brinquedo", finalPriceCents: 500, maxQuantity: 10, images: [] };

describe("carrinho por loja", () => {
  test("add grava só na chave da loja, com os campos do item", async () => {
    const storage = memoryStorage();
    const cart = createCart(storage, "patas");
    await cart.add(racao, 2);

    expect(Object.keys(storage.dump())).toEqual(["agendaflui.cart.patas"]);
    expect(cartKey("patas")).toBe("agendaflui.cart.patas");
    expect(await cart.items()).toEqual([
      { productId: "p1", name: "Ração", imageUrl: "https://img.test/p1.png", unitPriceCents: 1990, maxQuantity: 3, quantity: 2 },
    ]);
  });

  test("somar até passar do máximo fica no máximo", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add(racao, 2);
    await cart.add(racao, 2);
    expect((await cart.items())[0].quantity).toBe(3);
    expect(await cart.count()).toBe(3);
  });

  test("adicionar de novo atualiza preço e máximo do produto", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add(racao, 1);
    await cart.add({ ...racao, finalPriceCents: 1500, maxQuantity: 2 }, 1);
    const [item] = await cart.items();
    expect(item.unitPriceCents).toBe(1500);
    expect(item.maxQuantity).toBe(2);
    expect(item.quantity).toBe(2);
  });

  test("produto esgotado ou quantidade inválida não entra", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add({ ...racao, maxQuantity: 0 }, 1);
    await cart.add(racao, 0);
    await cart.add(racao, -2);
    expect(await cart.items()).toEqual([]);
  });

  test("setQuantity troca a quantidade (limitada ao máximo) e 0 remove", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add(racao, 1);
    await cart.setQuantity("p1", 9);
    expect((await cart.items())[0].quantity).toBe(3);
    await cart.setQuantity("p1", 2);
    expect((await cart.items())[0].quantity).toBe(2);
    await cart.setQuantity("p1", 0);
    expect(await cart.items()).toEqual([]);
  });

  test("remove tira só o produto", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add(racao, 1);
    await cart.add(brinquedo, 1);
    await cart.remove("p1");
    expect((await cart.items()).map((i) => i.productId)).toEqual(["p2"]);
  });

  test("totalCents é a soma de preço unitário vezes quantidade", async () => {
    const cart = createCart(memoryStorage(), "patas");
    await cart.add(racao, 2);
    await cart.add(brinquedo, 3);
    expect(await cart.totalCents()).toBe(1990 * 2 + 500 * 3);
    expect(await cart.count()).toBe(5);
  });

  test("o carrinho de outra loja começa vazio", async () => {
    const storage = memoryStorage();
    await createCart(storage, "patas").add(racao, 1);
    const outra = createCart(storage, "outra");
    expect(await outra.items()).toEqual([]);
    await outra.add(brinquedo, 1);
    expect((await createCart(storage, "patas").items()).map((i) => i.productId)).toEqual(["p1"]);
  });

  test("clearCartFor limpa só a loja pedida", async () => {
    const storage = memoryStorage();
    await createCart(storage, "patas").add(racao, 1);
    await createCart(storage, "outra").add(brinquedo, 1);
    await clearCartFor(storage, "patas");
    expect(Object.keys(storage.dump())).toEqual(["agendaflui.cart.outra"]);
    expect(await createCart(storage, "patas").items()).toEqual([]);
  });

  test("clear esvazia o carrinho", async () => {
    const storage = memoryStorage();
    const cart = createCart(storage, "patas");
    await cart.add(racao, 1);
    await cart.clear();
    expect(await cart.items()).toEqual([]);
    expect(storage.dump()).toEqual({});
  });

  test("conteúdo guardado estragado vira carrinho vazio, e item sem forma certa é ignorado", async () => {
    const storage = memoryStorage({ "agendaflui.cart.patas": "{não é json" });
    expect(await createCart(storage, "patas").items()).toEqual([]);
    const ruim = memoryStorage({
      "agendaflui.cart.patas": JSON.stringify([{ productId: "p1", quantity: "x" }, { productId: "p2", name: "B", unitPriceCents: 500, maxQuantity: 5, quantity: 2, imageUrl: null }]),
    });
    expect((await createCart(ruim, "patas").items()).map((i) => i.productId)).toEqual(["p2"]);
  });

  test("sem loja o carrinho não existe", () => {
    expect(() => createCart(memoryStorage(), "")).toThrow();
  });

  test("não guarda campos do produto além dos do item", async () => {
    const storage = memoryStorage();
    await createCart(storage, "patas").add({ ...racao, priceCents: 2500, promoPriceCents: 1990, description: "x", stock: 9 }, 1);
    expect(Object.keys(JSON.parse(storage.dump()["agendaflui.cart.patas"])[0]).sort()).toEqual(
      ["imageUrl", "maxQuantity", "name", "productId", "quantity", "unitPriceCents"]
    );
  });
});

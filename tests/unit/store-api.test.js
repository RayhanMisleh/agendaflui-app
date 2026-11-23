import * as store from "../../src/api/store";
import { createIdempotencyKeys } from "../../src/api/idempotency";

let mockHandler;

jest.mock("../../src/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter } = jest.requireActual("../helpers/fake-adapter");
  const adapter = fakeAdapter((call) => mockHandler(call));
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    getSlug: () => "patas",
    tokens: { get: () => null, set: async () => {}, clear: async () => {} },
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { api: client, __adapter: adapter };
});

const adapter = require("../../src/api").__adapter;
const last = () => adapter.calls[adapter.calls.length - 1];

beforeEach(() => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 200, data: {} });
});

describe("catálogo", () => {
  test("listCategories devolve items", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "c1", name: "Rações", productCount: 3 }] } });
    await expect(store.listCategories()).resolves.toEqual([{ id: "c1", name: "Rações", productCount: 3 }]);
    expect(last().method).toBe("GET");
    expect(last().url).toBe("/store/categories");
  });

  test("listProducts manda só os filtros que existem e devolve items e nextCursor", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "p1" }], nextCursor: "c2" } });
    await expect(store.listProducts({})).resolves.toEqual({ items: [{ id: "p1" }], nextCursor: "c2" });
    expect(last().url).toBe("/store/products");
    expect(last().params).toEqual({});
    await store.listProducts({ categoryId: "c1", search: "ração", cursor: "c2" });
    expect(last().params).toEqual({ categoryId: "c1", search: "ração", cursor: "c2" });
    await store.listProducts();
    expect(last().params).toEqual({});
  });

  test("listProducts sem nextCursor devolve null", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [] } });
    await expect(store.listProducts({})).resolves.toEqual({ items: [], nextCursor: null });
  });

  test("getProduct usa o id na rota, protegido", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "p 1" } });
    await expect(store.getProduct("p 1")).resolves.toEqual({ id: "p 1" });
    expect(last().url).toBe("/store/products/p%201");
  });

  test("getStoreOptions", async () => {
    const data = { pickup: { enabled: true, instructions: "Balcão" }, shipping: { enabled: true }, payment: { available: true } };
    mockHandler = async () => ({ status: 200, data });
    await expect(store.getStoreOptions()).resolves.toEqual(data);
    expect(last().url).toBe("/store/options");
  });

  test("404 module_disabled chega como erro reconhecível", async () => {
    mockHandler = async () => ({ status: 404, data: { error: { code: "module_disabled", message: "Esse recurso não está ligado nesta conta." } } });
    const error = await store.listProducts({}).catch((e) => e);
    expect(error.code).toBe("module_disabled");
  });
});

describe("CEP e endereços", () => {
  test("lookupPostalCode manda só os dígitos", async () => {
    mockHandler = async () => ({ status: 200, data: { address: null, unavailable: true } });
    await expect(store.lookupPostalCode("80010-000")).resolves.toEqual({ address: null, unavailable: true });
    expect(last().url).toBe("/store/postal-codes/80010000");
  });

  test("lookupPostalCode recusa CEP sem 8 números sem chamar a rede", async () => {
    await expect(store.lookupPostalCode("8001")).rejects.toMatchObject({ message: expect.any(String) });
    expect(adapter.calls).toHaveLength(0);
  });

  test("listAddresses devolve items", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "a1" }] } });
    await expect(store.listAddresses()).resolves.toEqual([{ id: "a1" }]);
    expect(last().url).toBe("/me/addresses");
  });

  test("createAddress manda só os campos do endereço, CEP limpo", async () => {
    mockHandler = async () => ({ status: 201, data: { id: "a1" } });
    await store.createAddress({
      label: "Casa", recipientName: "Ana", postalCode: "80010-000", street: "Rua A", number: "10", complement: "",
      district: "Centro", city: "Curitiba", state: "pr", isDefault: true, userId: "x", cep: "1",
    });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/me/addresses");
    expect(last().data).toEqual({
      label: "Casa", recipientName: "Ana", postalCode: "80010000", street: "Rua A", number: "10", complement: null,
      district: "Centro", city: "Curitiba", state: "PR", isDefault: true,
    });
  });

  test("updateAddress usa PATCH e deleteAddress usa DELETE", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "a1" } });
    await store.updateAddress("a1", { isDefault: true });
    expect(last().method).toBe("PATCH");
    expect(last().url).toBe("/me/addresses/a1");
    expect(last().data).toEqual({ isDefault: true });
    mockHandler = async () => ({ status: 204, data: undefined });
    await store.deleteAddress("a1");
    expect(last().method).toBe("DELETE");
    expect(last().url).toBe("/me/addresses/a1");
  });
});

describe("frete", () => {
  test("quoteShipping manda o endereço e só productId e quantity", async () => {
    const data = { pickup: { available: true, instructions: null }, options: [], shippingError: "Sem entrega." };
    mockHandler = async () => ({ status: 200, data });
    await expect(
      store.quoteShipping({ addressId: "a1", lines: [{ productId: "p1", quantity: 2, unitPriceCents: 1, priceCents: 9 }] })
    ).resolves.toEqual(data);
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/store/shipping-quotes");
    expect(last().data).toEqual({ addressId: "a1", lines: [{ productId: "p1", quantity: 2 }] });
  });
});

describe("pedido", () => {
  const body = {
    lines: [{ productId: "p1", quantity: 2, priceCents: 1990, name: "Ração" }],
    delivery: { method: "SHIPPING", addressId: "a1", quoteToken: "t1", priceCents: 1500, shippingCents: 1500 },
    note: null,
    priceCents: 1, totalCents: 2, shippingCents: 3,
  };

  test("createOrder manda a Idempotency-Key e nenhum preço, total nem frete", async () => {
    mockHandler = async () => ({ status: 201, data: { id: "o1" } });
    await expect(store.createOrder(body, "k1")).resolves.toEqual({ id: "o1" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/store/orders");
    expect(last().headers["idempotency-key"]).toBe("k1");
    expect(last().data).toEqual({
      lines: [{ productId: "p1", quantity: 2 }],
      delivery: { method: "SHIPPING", addressId: "a1", quoteToken: "t1" },
    });
    const text = JSON.stringify(last().data);
    for (const word of ["priceCents", "totalCents", "shippingCents", "unitPriceCents"]) expect(text).not.toContain(word);
  });

  test("createOrder com observação manda a observação; retirada vai sem endereço", async () => {
    mockHandler = async () => ({ status: 201, data: { id: "o1" } });
    await store.createOrder({ lines: [{ productId: "p1", quantity: 1 }], delivery: { method: "PICKUP", addressId: "a1" }, note: "  campainha  " }, "k1");
    expect(last().data).toEqual({ lines: [{ productId: "p1", quantity: 1 }], delivery: { method: "PICKUP" }, note: "campainha" });
  });

  test("createOrder sem Idempotency-Key nem sai", async () => {
    await expect(store.createOrder(body, "")).rejects.toBeTruthy();
    await expect(store.createOrder(body)).rejects.toBeTruthy();
    expect(adapter.calls).toHaveLength(0);
  });

  test("primeira tentativa sem rede e segunda com sucesso saem com a mesma chave; outro carrinho sai com outra", async () => {
    let n = 0;
    const keys = createIdempotencyKeys(() => `chave-${++n}`);
    const signature = "carrinho-1";
    let attempt = 0;
    mockHandler = async () => {
      attempt += 1;
      if (attempt === 1) throw "network";
      return { status: 201, data: { id: "o1" } };
    };

    await expect(store.createOrder(body, keys.keyFor(signature))).rejects.toMatchObject({ message: expect.any(String) });
    await store.createOrder(body, keys.keyFor(signature));
    keys.done(signature);

    expect(adapter.calls).toHaveLength(2);
    expect(adapter.calls[0].headers["idempotency-key"]).toBe("chave-1");
    expect(adapter.calls[1].headers["idempotency-key"]).toBe("chave-1");

    await store.createOrder({ ...body, lines: [{ productId: "p2", quantity: 1 }] }, keys.keyFor("carrinho-2"));
    expect(adapter.calls[2].headers["idempotency-key"]).toBe("chave-2");
  });

  test("409 too_many_open_orders chega com a mensagem do servidor", async () => {
    mockHandler = async () => ({
      status: 409,
      data: { error: { code: "conflict", reason: "too_many_open_orders", message: "Você já tem pedidos esperando pagamento. Pague ou cancele um deles." } },
    });
    const error = await store.createOrder(body, "k1").catch((e) => e);
    expect(error.status).toBe(409);
    expect(error.reason).toBe("too_many_open_orders");
    expect(error.message).toBe("Você já tem pedidos esperando pagamento. Pague ou cancele um deles.");
  });

  test("listOrders manda status e cursor só quando existem", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [{ id: "o1" }], nextCursor: "c2" } });
    await expect(store.listOrders({})).resolves.toEqual({ items: [{ id: "o1" }], nextCursor: "c2" });
    expect(last().url).toBe("/store/orders");
    expect(last().params).toEqual({});
    await store.listOrders({ status: "PAID", cursor: "c2" });
    expect(last().params).toEqual({ status: "PAID", cursor: "c2" });
  });

  test("getOrder", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "o1" } });
    await expect(store.getOrder("o1")).resolves.toEqual({ id: "o1" });
    expect(last().url).toBe("/store/orders/o1");
  });

  test("cancelOrder usa POST e manda o motivo só quando existe", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "o1", status: "CANCELED" } });
    await expect(store.cancelOrder("o1", null)).resolves.toEqual({ id: "o1", status: "CANCELED" });
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/store/orders/o1/cancel");
    expect(last().data).toEqual({});
    await store.cancelOrder("o1", "Mudei de ideia");
    expect(last().data).toEqual({ reason: "Mudei de ideia" });
  });

  test("startCheckout manda returnUrl só quando existe e devolve o endereço do pagamento", async () => {
    const data = { checkoutUrl: "https://mp.test/pagar", expiresAt: "2026-11-18T12:00:00Z", expiresLabel: "até 12:00" };
    mockHandler = async () => ({ status: 200, data });
    await expect(store.startCheckout("o1", null)).resolves.toEqual(data);
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/store/orders/o1/checkout");
    expect(last().data).toEqual({});
    await store.startCheckout("o1", "https://app.test/patas/pedidos/o1");
    expect(last().data).toEqual({ returnUrl: "https://app.test/patas/pedidos/o1" });
  });
});

describe("sem vouchers", () => {
  test("nenhuma função chama caminho com voucher", async () => {
    mockHandler = async () => ({ status: 200, data: { items: [], nextCursor: null, address: null, options: [], pickup: {}, shipping: {}, payment: {} } });
    await store.listCategories();
    await store.listProducts({});
    await store.getProduct("p1");
    await store.getStoreOptions();
    await store.lookupPostalCode("80010000");
    await store.listAddresses();
    await store.createAddress({ recipientName: "A", postalCode: "80010000", street: "R", number: "1", district: "B", city: "C", state: "PR" });
    await store.updateAddress("a1", { number: "2" });
    await store.deleteAddress("a1");
    await store.quoteShipping({ addressId: "a1", lines: [{ productId: "p1", quantity: 1 }] });
    await store.createOrder({ lines: [{ productId: "p1", quantity: 1 }], delivery: { method: "PICKUP" } }, "k1");
    await store.listOrders({});
    await store.getOrder("o1");
    await store.cancelOrder("o1", null);
    await store.startCheckout("o1", null);
    expect(adapter.calls.length).toBeGreaterThan(10);
    for (const call of adapter.calls) {
      expect(call.url.toLowerCase()).not.toContain("voucher");
      expect(JSON.stringify(call.data || {}).toLowerCase()).not.toContain("voucher");
    }
  });
});

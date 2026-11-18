import {
  toOrderLines,
  buildDelivery,
  orderSignature,
  checkoutReturnUrl,
  formatCents,
  orderStatusLabel,
  createOrderSubmitter,
  orderKeys,
} from "../../src/store/order";
import { openCheckout } from "../../src/store/checkout";
import { createIdempotencyKeys } from "../../src/api/idempotency";
import { ApiError } from "../../src/api/errors";

const plain = (text) => text.replace(/[  ]/g, " ");

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn(async () => ({ type: "dismiss" })) }));

describe("linhas e entrega", () => {
  test("toOrderLines manda só productId e quantity", () => {
    const items = [{ productId: "p1", name: "Ração", unitPriceCents: 1990, maxQuantity: 3, quantity: 2, imageUrl: "x" }];
    expect(toOrderLines(items)).toEqual([{ productId: "p1", quantity: 2 }]);
  });

  test("buildDelivery: retirada e entrega", () => {
    expect(buildDelivery({ method: "PICKUP" })).toEqual({ method: "PICKUP" });
    expect(buildDelivery({ method: "SHIPPING", addressId: "a1", quoteToken: "t", priceCents: 999, serviceCode: "X" })).toEqual({
      method: "SHIPPING",
      addressId: "a1",
      quoteToken: "t",
    });
  });

  test("buildDelivery recusa entrega sem endereço ou sem cotação", () => {
    expect(() => buildDelivery({ method: "SHIPPING", addressId: "a1" })).toThrow();
    expect(() => buildDelivery({ method: "SHIPPING", quoteToken: "t" })).toThrow();
    expect(() => buildDelivery({ method: "NONE" })).toThrow();
    expect(() => buildDelivery(null)).toThrow();
  });

  test("orderSignature não depende da ordem das linhas e muda com o conteúdo", () => {
    const a = [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 2 }];
    const b = [a[1], a[0]];
    const ship = buildDelivery({ method: "SHIPPING", addressId: "a1", quoteToken: "t1" });
    expect(orderSignature(a, ship)).toBe(orderSignature(b, ship));
    expect(orderSignature(a, buildDelivery({ method: "SHIPPING", addressId: "a1", quoteToken: "t2" }))).not.toBe(orderSignature(a, ship));
    expect(orderSignature(a, buildDelivery({ method: "SHIPPING", addressId: "a2", quoteToken: "t1" }))).not.toBe(orderSignature(a, ship));
    expect(orderSignature(a, { method: "PICKUP" })).not.toBe(orderSignature(a, ship));
    expect(orderSignature([{ productId: "p1", quantity: 2 }, a[1]], ship)).not.toBe(orderSignature(a, ship));
  });
});

describe("volta do checkout", () => {
  test("web volta ao pedido do app; celular não manda endereço", () => {
    expect(checkoutReturnUrl({ platform: "web", origin: "https://app.agendaflui.com.br", slug: "patas", orderId: "o1" })).toBe(
      "https://app.agendaflui.com.br/patas/pedidos/o1"
    );
    expect(checkoutReturnUrl({ platform: "ios", origin: "https://app.agendaflui.com.br", slug: "patas", orderId: "o1" })).toBeNull();
    expect(checkoutReturnUrl({ platform: "android", origin: null, slug: "patas", orderId: "o1" })).toBeNull();
  });

  test("web sem origem não inventa endereço", () => {
    expect(checkoutReturnUrl({ platform: "web", origin: "", slug: "patas", orderId: "o1" })).toBeNull();
  });

  test("openCheckout abre só http(s) no navegador do app", async () => {
    const WebBrowser = require("expo-web-browser");
    await openCheckout("https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1");
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith("https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1");
    WebBrowser.openBrowserAsync.mockClear();
    await expect(openCheckout("javascript:alert(1)")).rejects.toBeTruthy();
    await expect(openCheckout("")).rejects.toBeTruthy();
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
  });
});

describe("apresentação", () => {
  test("formatCents", () => {
    expect(plain(formatCents(123450))).toBe("R$ 1.234,50");
    expect(plain(formatCents(5))).toBe("R$ 0,05");
  });

  test("orderStatusLabel", () => {
    expect(orderStatusLabel({ status: "AWAITING_PAYMENT", fulfillmentStatus: "PENDING" })).toBe("Aguardando pagamento");
    expect(orderStatusLabel({ status: "PAID", fulfillmentStatus: "PENDING" })).toBe("Pago");
    expect(orderStatusLabel({ status: "PAID", fulfillmentStatus: "READY_FOR_PICKUP" })).toBe("Pronto para retirar");
    expect(orderStatusLabel({ status: "PAID", fulfillmentStatus: "SHIPPED" })).toBe("Enviado");
    expect(orderStatusLabel({ status: "PAID", fulfillmentStatus: "DELIVERED" })).toBe("Entregue");
    expect(orderStatusLabel({ status: "CANCELED", fulfillmentStatus: "PENDING" })).toBe("Cancelado");
    expect(orderStatusLabel({ status: "EXPIRED", fulfillmentStatus: "PENDING" })).toBe("Prazo de pagamento vencido");
    expect(orderStatusLabel({ status: "OUTRO", fulfillmentStatus: "PENDING" })).toBe("");
  });
});

describe("envio do pedido", () => {
  const lines = [{ productId: "p1", quantity: 1 }];
  const pickup = { method: "PICKUP" };
  const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  const counter = () => {
    let n = 0;
    return createIdempotencyKeys(() => `chave-${++n}`);
  };

  test("dois toques em Finalizar mandam um pedido só, com a mesma resposta", async () => {
    const pending = deferred();
    const send = jest.fn(() => pending.promise);
    const submitter = createOrderSubmitter({ send, keys: counter() });

    const first = submitter.submit({ lines, delivery: pickup });
    const second = submitter.submit({ lines, delivery: pickup });
    expect(submitter.isSending()).toBe(true);
    pending.resolve({ id: "o1" });

    await expect(first).resolves.toEqual({ id: "o1" });
    await expect(second).resolves.toEqual({ id: "o1" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(submitter.isSending()).toBe(false);
  });

  test("sem rede na primeira tentativa: a nova tentativa sai com a MESMA chave", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError("Sem conexão.", { code: "network" }))
      .mockResolvedValueOnce({ id: "o1" });
    const submitter = createOrderSubmitter({ send, keys: counter() });

    await expect(submitter.submit({ lines, delivery: pickup })).rejects.toMatchObject({ code: "network" });
    await submitter.submit({ lines, delivery: pickup });

    expect(send.mock.calls[0][1]).toBe("chave-1");
    expect(send.mock.calls[1][1]).toBe("chave-1");
  });

  test("erro 5xx e tempo esgotado também repetem a chave", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError("Erro.", { status: 503 }))
      .mockRejectedValueOnce(new ApiError("Demorou.", { code: "timeout" }))
      .mockResolvedValueOnce({ id: "o1" });
    const submitter = createOrderSubmitter({ send, keys: counter() });
    await submitter.submit({ lines, delivery: pickup }).catch(() => {});
    await submitter.submit({ lines, delivery: pickup }).catch(() => {});
    await submitter.submit({ lines, delivery: pickup });
    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-1", "chave-1"]);
  });

  test("carrinho ou cotação diferente sai com outra chave", async () => {
    const send = jest.fn(async () => ({ id: "o" }));
    const keys = counter();
    const submitter = createOrderSubmitter({ send, keys });
    const ship = (token) => ({ method: "SHIPPING", addressId: "a1", quoteToken: token });
    const failing = jest.fn().mockRejectedValue(new ApiError("Sem conexão.", { code: "network" }));
    const flaky = createOrderSubmitter({ send: failing, keys });

    await flaky.submit({ lines, delivery: ship("t1") }).catch(() => {});
    await flaky.submit({ lines, delivery: ship("t2") }).catch(() => {});
    await flaky.submit({ lines: [{ productId: "p1", quantity: 2 }], delivery: ship("t2") }).catch(() => {});
    expect(failing.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-2", "chave-3"]);
    expect(send).not.toHaveBeenCalled();
    expect(submitter.isSending()).toBe(false);
  });

  test("depois do sucesso o mesmo carrinho é outra compra: chave nova", async () => {
    const send = jest.fn(async () => ({ id: "o1" }));
    const submitter = createOrderSubmitter({ send, keys: counter() });
    await submitter.submit({ lines, delivery: pickup });
    await submitter.submit({ lines, delivery: pickup });
    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-2"]);
  });

  test("recusa do servidor (409, 422) descarta a chave; rede não", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError("Sem estoque.", { status: 409, code: "conflict", reason: "out_of_stock" }))
      .mockResolvedValueOnce({ id: "o1" });
    const submitter = createOrderSubmitter({ send, keys: counter() });
    await expect(submitter.submit({ lines, delivery: pickup })).rejects.toMatchObject({ reason: "out_of_stock" });
    await submitter.submit({ lines, delivery: pickup });
    expect(send.mock.calls.map((c) => c[1])).toEqual(["chave-1", "chave-2"]);
  });

  test("manda ao envio só o que o pedido precisa", async () => {
    const send = jest.fn(async () => ({ id: "o1" }));
    const submitter = createOrderSubmitter({ send, keys: counter() });
    await submitter.submit({ lines, delivery: pickup, note: "tocar a campainha" });
    expect(send.mock.calls[0][0]).toEqual({ lines, delivery: pickup, note: "tocar a campainha" });
  });

  test("há chaves de pedido da sessão do app", () => {
    expect(typeof orderKeys.keyFor).toBe("function");
  });
});

describe("textos de entrega", () => {
  const { addressLine, formatCep, shippingDaysLabel } = require("../../src/store/order");

  test("addressLine junta rua, bairro, cidade e CEP", () => {
    expect(
      addressLine({ street: "Rua A", number: "10", complement: "apto 2", district: "Centro", city: "Curitiba", state: "PR", postalCode: "80010000" })
    ).toBe("Rua A, 10, apto 2 - Centro, Curitiba/PR - CEP 80010-000");
    expect(addressLine({ street: "Rua A", number: "10", complement: null, district: "Centro", city: "Curitiba", state: "PR", postalCode: "80010000" })).toBe(
      "Rua A, 10 - Centro, Curitiba/PR - CEP 80010-000"
    );
    expect(addressLine(null)).toBe("");
  });

  test("formatCep põe o traço e limita a 8 números", () => {
    expect(formatCep("80010000")).toBe("80010-000");
    expect(formatCep("8001")).toBe("8001");
    expect(formatCep("80010-000123")).toBe("80010-000");
  });

  test("shippingDaysLabel", () => {
    expect(shippingDaysLabel(1)).toBe("Chega em 1 dia útil");
    expect(shippingDaysLabel(5)).toBe("Chega em 5 dias úteis");
    expect(shippingDaysLabel(0)).toBe("Prazo a combinar");
  });
});

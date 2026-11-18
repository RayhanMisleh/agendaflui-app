import { createIdempotencyKeys, newIdempotencyKey } from "../../src/api/idempotency";

// O módulo nativo não existe no Jest: o UUID vem do crypto do Node, com o mesmo formato do expo-crypto.
jest.mock("expo-crypto", () => ({ randomUUID: () => require("crypto").randomUUID() }));

const FORMAT = /^[A-Za-z0-9_-]{1,80}$/;

describe("createIdempotencyKeys", () => {
  function counter() {
    let n = 0;
    return () => `chave-${++n}`;
  }

  test("a mesma assinatura devolve a mesma chave", () => {
    const keys = createIdempotencyKeys(counter());
    expect(keys.keyFor("pedido:a")).toBe(keys.keyFor("pedido:a"));
  });

  test("outra assinatura ganha outra chave", () => {
    const keys = createIdempotencyKeys(counter());
    expect(keys.keyFor("pedido:a")).not.toBe(keys.keyFor("pedido:b"));
  });

  test("depois de done, a mesma assinatura ganha chave nova", () => {
    const keys = createIdempotencyKeys(counter());
    const first = keys.keyFor("pedido:a");
    keys.done("pedido:a");
    expect(keys.keyFor("pedido:a")).not.toBe(first);
  });

  test("done de uma assinatura não mexe nas outras", () => {
    const keys = createIdempotencyKeys(counter());
    const b = keys.keyFor("pedido:b");
    keys.keyFor("pedido:a");
    keys.done("pedido:a");
    expect(keys.keyFor("pedido:b")).toBe(b);
  });

  test("a chave padrão casa com o formato aceito pela API e muda a cada uso", () => {
    const keys = createIdempotencyKeys();
    const a = keys.keyFor("x");
    const b = keys.keyFor("y");
    expect(a).toMatch(FORMAT);
    expect(b).toMatch(FORMAT);
    expect(a).not.toBe(b);
    expect(newIdempotencyKey()).toMatch(FORMAT);
  });
});

import { createSessionEndHandler } from "../../src/session/sessionEnd";

describe("sessão que venceu", () => {
  test("limpa o carrinho da loja e volta a visitante", async () => {
    const clearCart = jest.fn(async () => {});
    const showGuest = jest.fn();
    const handler = createSessionEndHandler({ getSlug: () => "patas", clearCart, showGuest });
    handler();
    expect(showGuest).toHaveBeenCalledTimes(1);
    expect(clearCart).toHaveBeenCalledWith("patas");
  });

  test("sem loja, não limpa nada mas ainda volta a visitante", () => {
    const clearCart = jest.fn(async () => {});
    const showGuest = jest.fn();
    createSessionEndHandler({ getSlug: () => null, clearCart, showGuest })();
    expect(clearCart).not.toHaveBeenCalled();
    expect(showGuest).toHaveBeenCalledTimes(1);
  });

  test("falha ao limpar o carrinho não quebra", async () => {
    const showGuest = jest.fn();
    const clearCart = jest.fn(async () => {
      throw new Error("sem disco");
    });
    expect(() => createSessionEndHandler({ getSlug: () => "patas", clearCart, showGuest })()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});

import { deleteAccountFlow } from "../../src/services/accountDeletion";
import { ApiError } from "../../src/api/errors";

function setup(overrides = {}) {
  const calls = [];
  const deps = {
    deleteAccount: jest.fn(async () => calls.push("delete")),
    unregisterDevice: jest.fn(async () => calls.push("push")),
    endSession: jest.fn(async () => calls.push("session")),
    clearCart: jest.fn(async () => calls.push("cart")),
    ...overrides,
  };
  return { deps, calls };
}

describe("deleteAccountFlow", () => {
  test("com a exclusão confirmada, tira o aparelho, encerra a sessão e limpa o carrinho, nessa ordem", async () => {
    const { deps, calls } = setup();
    await deleteAccountFlow({ password: "segredo1", ...deps });
    expect(deps.deleteAccount).toHaveBeenCalledWith("segredo1");
    expect(calls).toEqual(["delete", "push", "session", "cart"]);
  });

  test("senha errada: nada é tocado além da chamada ao servidor", async () => {
    const { deps, calls } = setup({
      deleteAccount: jest.fn(async () => {
        throw new ApiError("Senha incorreta.", { status: 401, code: "unauthorized" });
      }),
    });
    await expect(deleteAccountFlow({ password: "errada", ...deps })).rejects.toMatchObject({ status: 401 });
    expect(deps.unregisterDevice).not.toHaveBeenCalled();
    expect(deps.endSession).not.toHaveBeenCalled();
    expect(deps.clearCart).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  test("falha em limpar o aparelho ou o carrinho não desfaz a exclusão", async () => {
    const { deps } = setup({
      unregisterDevice: jest.fn(async () => {
        throw new Error("sem rede");
      }),
      clearCart: jest.fn(async () => {
        throw new Error("sem disco");
      }),
    });
    await expect(deleteAccountFlow({ password: "segredo1", ...deps })).resolves.toBeUndefined();
    expect(deps.endSession).toHaveBeenCalledTimes(1);
  });
});

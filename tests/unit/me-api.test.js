import { getMe, updateMe, changePassword, deleteAccount } from "../../src/api/me";
import { ApiError } from "../../src/api/errors";

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
  mockHandler = async () => ({ status: 204, data: undefined });
});

describe("conta do cliente", () => {
  test("getMe devolve o cadastro", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "c1", name: "Ana", isClubMember: true } });
    await expect(getMe()).resolves.toEqual({ id: "c1", name: "Ana", isClubMember: true });
    expect(last().method).toBe("GET");
    expect(last().url).toBe("/me");
  });

  test("updateMe usa PATCH e manda só nome, telefone e nascimento", async () => {
    mockHandler = async () => ({ status: 200, data: { id: "c1", name: "Ana Maria" } });
    await updateMe({ name: "Ana Maria", phone: "11999990000", isClubMember: true, notes: "x" });
    expect(last().method).toBe("PATCH");
    expect(last().url).toBe("/me");
    expect(last().data).toEqual({ name: "Ana Maria", phone: "11999990000" });
  });

  test("changePassword manda { current, next } por PUT /me/password", async () => {
    await changePassword({ current: "antiga12345", next: "nova1234567" });
    expect(last().method).toBe("PUT");
    expect(last().url).toBe("/me/password");
    expect(last().data).toEqual({ current: "antiga12345", next: "nova1234567" });
  });

  test("deleteAccount manda { password } por POST /me/delete", async () => {
    await deleteAccount("x");
    expect(last().method).toBe("POST");
    expect(last().url).toBe("/me/delete");
    expect(last().data).toEqual({ password: "x" });
  });

  test("senha errada vira ApiError com a mensagem do servidor", async () => {
    mockHandler = async () => ({
      status: 403,
      data: { error: { code: "forbidden", reason: "wrong_password", message: "Senha incorreta." } },
    });
    const failure = await deleteAccount("errada").catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.message).toBe("Senha incorreta.");
    expect(failure.reason).toBe("wrong_password");
  });
});

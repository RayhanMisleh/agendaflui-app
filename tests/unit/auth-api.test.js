import { login, register, verify, forgotPassword, resetPassword } from "../../src/api/auth";
import { ApiError } from "../../src/api/errors";

let mockHandler;

// O módulo de entrada usa o cliente único; aqui ele ganha um adaptador falso (nada sai do processo).
jest.mock("../../src/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter } = jest.requireActual("../helpers/fake-adapter");
  const adapter = fakeAdapter((call) => mockHandler(call));
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    appKey: "chave-de-teste",
    getSlug: () => "patas",
    tokens: { get: () => null, set: async () => {}, clear: async () => {} },
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { api: client, __adapter: adapter };
});

const adapter = require("../../src/api").__adapter;

const SESSION = {
  tokens: {
    accessToken: "acc",
    accessExpiresAt: "2026-11-18T12:15:00.000Z",
    refreshToken: "ref",
    refreshExpiresAt: "2026-12-18T12:00:00.000Z",
  },
  customer: { id: "c1", name: "Ana", email: "ana@x.com" },
};

beforeEach(() => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 200, data: SESSION });
});

describe("login", () => {
  test("apara e põe o e-mail em minúsculas, manda a senha como está e devolve tokens e cliente", async () => {
    await expect(login({ email: " Ana@X.com ", password: " segredo123 " })).resolves.toEqual(SESSION);
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0].method).toBe("POST");
    expect(adapter.calls[0].url).toBe("/auth/customer/login");
    expect(adapter.calls[0].data).toEqual({ email: "ana@x.com", password: " segredo123 " });
    expect(adapter.calls[0].headers["x-business"]).toBe("patas");
  });

  test("credenciais erradas viram ApiError com a mensagem do servidor", async () => {
    mockHandler = async () => ({
      status: 401,
      data: { error: { code: "unauthorized", reason: "invalid_credentials", message: "E-mail ou senha incorretos." } },
    });
    const failure = await login({ email: "a@x.com", password: "errada12345" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.message).toBe("E-mail ou senha incorretos.");
    expect(failure.reason).toBe("invalid_credentials");
  });
});

describe("register", () => {
  test("manda nome, e-mail limpo, telefone e senha para o cadastro e não devolve nada", async () => {
    mockHandler = async () => ({ status: 202, data: { status: "verification_sent" } });
    await expect(
      register({ name: " Ana ", email: " ANA@x.com", phone: "11 99999-0000", password: "senha-longa-1" })
    ).resolves.toBeUndefined();
    expect(adapter.calls[0].url).toBe("/auth/customer/register");
    expect(adapter.calls[0].data).toEqual({
      name: "Ana",
      email: "ana@x.com",
      phone: "11 99999-0000",
      password: "senha-longa-1",
    });
  });

  test("telefone vazio vira null", async () => {
    mockHandler = async () => ({ status: 202, data: { status: "verification_sent" } });
    await register({ name: "Ana", email: "ana@x.com", phone: "", password: "senha-longa-1" });
    expect(adapter.calls[0].data.phone).toBeNull();
    await register({ name: "Ana", email: "ana@x.com", password: "senha-longa-1" });
    expect(adapter.calls[1].data.phone).toBeNull();
    await register({ name: "Ana", email: "ana@x.com", phone: "   ", password: "senha-longa-1" });
    expect(adapter.calls[2].data.phone).toBeNull();
  });

  test("422 com fields.password chega em ApiError.fields.password", async () => {
    mockHandler = async () => ({
      status: 422,
      data: {
        error: {
          code: "validation_failed",
          message: "Confira os campos.",
          fields: { password: "Use pelo menos 10 caracteres." },
        },
      },
    });
    const failure = await register({ name: "Ana", email: "ana@x.com", password: "curta" }).catch((e) => e);
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(422);
    expect(failure.fields.password).toBe("Use pelo menos 10 caracteres.");
  });
});

describe("verify", () => {
  test("manda e-mail e código aparado e devolve tokens e cliente", async () => {
    await expect(verify({ email: " Ana@X.com", code: " 123456 " })).resolves.toEqual(SESSION);
    expect(adapter.calls[0].url).toBe("/auth/customer/verify");
    expect(adapter.calls[0].data).toEqual({ email: "ana@x.com", code: "123456" });
  });

  test("invalid_code traz a mensagem do servidor", async () => {
    mockHandler = async () => ({
      status: 422,
      data: {
        error: {
          code: "validation_failed",
          reason: "invalid_code",
          message: "Código incorreto ou vencido.",
          fields: { code: "Código incorreto ou vencido." },
        },
      },
    });
    const failure = await verify({ email: "ana@x.com", code: "000000" }).catch((e) => e);
    expect(failure.reason).toBe("invalid_code");
    expect(failure.message).toBe("Código incorreto ou vencido.");
  });
});

describe("forgotPassword", () => {
  test("pede o código só com o e-mail limpo", async () => {
    mockHandler = async () => ({ status: 202, data: { status: "verification_sent" } });
    await expect(forgotPassword(" Ana@X.com ")).resolves.toBeUndefined();
    expect(adapter.calls[0].method).toBe("POST");
    expect(adapter.calls[0].url).toBe("/auth/customer/password/forgot");
    expect(adapter.calls[0].data).toEqual({ email: "ana@x.com" });
  });
});

describe("resetPassword", () => {
  test("manda e-mail, código e senha nova e aceita a resposta 204", async () => {
    mockHandler = async () => ({ status: 204, data: undefined });
    await expect(
      resetPassword({ email: " Ana@X.com", code: " 654321", password: "senha-nova-123" })
    ).resolves.toBeUndefined();
    expect(adapter.calls[0].url).toBe("/auth/customer/password/reset");
    expect(adapter.calls[0].data).toEqual({ email: "ana@x.com", code: "654321", password: "senha-nova-123" });
  });
});

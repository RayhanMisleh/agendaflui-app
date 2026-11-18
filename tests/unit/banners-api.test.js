import { listBanners } from "../../src/api/banners";

let mockHandler;

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

beforeEach(() => {
  adapter.calls.length = 0;
});

describe("listBanners", () => {
  test("GET /banners devolve items", async () => {
    const items = [{ id: "b1", title: "Promoção", imageUrl: "https://x.test/a.png", linkUrl: null }];
    mockHandler = async () => ({ status: 200, data: { items } });
    await expect(listBanners()).resolves.toEqual(items);
    expect(adapter.calls[0].method).toBe("GET");
    expect(adapter.calls[0].url).toBe("/banners");
  });

  test("módulo desligado rejeita com module_disabled", async () => {
    mockHandler = async () => ({ status: 404, data: { error: { code: "module_disabled", message: "Desligado." } } });
    await expect(listBanners()).rejects.toMatchObject({ status: 404, code: "module_disabled" });
  });
});

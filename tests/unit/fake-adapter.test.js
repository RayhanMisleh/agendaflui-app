import { fakeAdapter } from "../helpers/fake-adapter";
import { createApiClient } from "../../src/api/client";

describe("fakeAdapter", () => {
  test("mais chamadas que o teto viram erro, em vez de travar o teste num laço", async () => {
    const adapter = fakeAdapter(async () => ({ status: 200, data: {} }), { maxCalls: 3 });
    const { http } = createApiClient({
      baseURL: "https://api.test/v1",
      appKey: "k",
      getSlug: () => "patas",
      tokens: { get: () => null, set: async () => {}, clear: async () => {}, generation: () => 0 },
      onSessionEnded() {},
      onBusinessGone() {},
      adapter,
    });
    for (let i = 0; i < 3; i++) await http.get("/x");
    await expect(http.get("/x")).rejects.toThrow();
    expect(adapter.calls).toHaveLength(3);
  });
});

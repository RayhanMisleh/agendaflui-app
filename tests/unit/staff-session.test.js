import { createStaffSession, decideIncomingLink, enterCustomerMode, STAFF_LINK_NOTICE } from "../../src/staff/session";
import { createBusinessStore } from "../../src/business/businessStore";
import { leaveBusiness } from "../../src/business/switching";
import { createTokenStore, createSessionTokens } from "../../src/session/tokenStore";
import { memoryStorage } from "../helpers/memory-storage";

const STAFF_KEY = "agendaflui.staffSession";
const CUSTOMER_KEY = "agendaflui.session";
const tokensOf = (n) => ({
  accessToken: `acc-${n}`,
  accessExpiresAt: "2026-11-23T12:15:00.000Z",
  refreshToken: `ref-${n}`,
  refreshExpiresAt: "2026-12-23T12:00:00.000Z",
});
const LOGIN = {
  tokens: tokensOf("staff"),
  member: { userId: "u1", membershipId: "m1", name: "Ana", role: "PROFESSIONAL", professionalId: "p1" },
  business: { id: "b1", slug: "patas", name: "Patas e Pelos" },
};

// Aparelho com uma sessão de cliente na loja "antiga"; a equipe entra na loja "patas".
async function setup({ login = jest.fn(async () => LOGIN), logout = jest.fn(async () => {}), withCustomer = true } = {}) {
  const storage = memoryStorage();
  const state = { slug: null };
  const getSlug = () => state.slug;
  const businessStore = createBusinessStore(storage);
  const customerTokens = createSessionTokens(createTokenStore(storage), getSlug);
  const staffTokens = createSessionTokens(createTokenStore(storage, { key: STAFF_KEY }), getSlug);
  const order = [];

  if (withCustomer) {
    state.slug = "antiga";
    await businessStore.setSlug("antiga");
    await businessStore.setMode("customer");
    await customerTokens.set(tokensOf("cliente"));
  }

  const clearCart = jest.fn(async () => {});
  const clearPush = jest.fn(async () => {
    order.push("push-cliente");
  });
  const deps = {
    login,
    logout,
    tokens: staffTokens,
    businessStore,
    getSlug,
    leaveCustomer: async () => {
      order.push("sai-cliente");
      if (!state.slug) return;
      const slug = state.slug;
      await leaveBusiness({ http: { post: () => Promise.resolve() }, slug, tokens: customerTokens, businessStore, clearCart, clearPush });
      state.slug = null;
    },
    selectBusiness: jest.fn(async (slug) => {
      order.push("escolhe-loja");
      await businessStore.setSlug(slug);
      state.slug = slug;
    }),
    resetBusiness: jest.fn(() => {
      state.slug = null;
    }),
    registerDevice: jest.fn(async () => {
      order.push("registra-aparelho");
    }),
    unregisterDevice: jest.fn(async () => {
      order.push("tira-aparelho");
    }),
  };
  return { session: createStaffSession(deps), deps, storage, state, businessStore, staffTokens, customerTokens, clearCart, clearPush, order };
}

describe("decideIncomingLink", () => {
  test("link de loja com a equipe logada é ignorado", () => {
    expect(decideIncomingLink("staff", "patas", "outra")).toBe("ignore_staff");
    expect(decideIncomingLink("staff", "patas", "patas")).toBe("ignore_staff");
    expect(decideIncomingLink("staff", null, "outra")).toBe("ignore_staff");
  });

  test("fora do modo equipe segue a regra de sempre", () => {
    for (const mode of ["customer", null]) {
      expect(decideIncomingLink(mode, null, "patas")).toBe("select");
      expect(decideIncomingLink(mode, "patas", "outra")).toBe("confirm");
      expect(decideIncomingLink(mode, "patas", "patas")).toBe("none");
      expect(decideIncomingLink(mode, "patas", null)).toBe("none");
    }
  });

  test("o aviso do link é o texto combinado", () => {
    expect(STAFF_LINK_NOTICE).toBe("Saia da conta da equipe para entrar como cliente.");
  });
});

describe("signIn", () => {
  test("guarda a sessão da equipe, o modo e a loja; apaga a sessão de cliente", async () => {
    const { session, deps, storage, businessStore, staffTokens, clearCart, clearPush, state, order } = await setup();

    const result = await session.signIn("  Ana@Loja.com ", "segredo");

    expect(deps.login).toHaveBeenCalledWith({ email: "  Ana@Loja.com ", password: "segredo" });
    expect(result).toEqual({ member: LOGIN.member, business: LOGIN.business });
    // sessão do cliente, aparelho e carrinho dele: apagados
    expect(storage.dump()[CUSTOMER_KEY]).toBeUndefined();
    expect(clearPush).toHaveBeenCalled();
    expect(clearCart).toHaveBeenCalled();
    // sessão da equipe presa à loja nova
    expect(JSON.parse(storage.dump()[STAFF_KEY])).toMatchObject({ slug: "patas", accessToken: "acc-staff", refreshToken: "ref-staff" });
    expect(staffTokens.get().accessToken).toBe("acc-staff");
    expect(await businessStore.getMode()).toBe("staff");
    expect(await businessStore.getSlug()).toBe("patas");
    expect(deps.selectBusiness).toHaveBeenCalledWith("patas", null, { asStaff: true });
    expect(state.slug).toBe("patas");
    expect(order).toEqual(["sai-cliente", "push-cliente", "escolhe-loja", "registra-aparelho"]);
  });

  test("sem loja de cliente, só entra como equipe", async () => {
    const { session, businessStore, storage } = await setup({ withCustomer: false });
    await session.signIn("a@b.com", "x");
    expect(await businessStore.getMode()).toBe("staff");
    expect(JSON.parse(storage.dump()[STAFF_KEY]).slug).toBe("patas");
  });

  test("login recusado não mexe em nada: a sessão de cliente continua", async () => {
    const login = jest.fn(async () => {
      throw Object.assign(new Error("E-mail ou senha incorretos."), { status: 401 });
    });
    const { session, storage, businessStore, order, deps } = await setup({ login });
    await expect(session.signIn("a@b.com", "x")).rejects.toThrow("E-mail ou senha incorretos.");
    expect(storage.dump()[CUSTOMER_KEY]).toBeDefined();
    expect(storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(await businessStore.getMode()).toBe("customer");
    expect(await businessStore.getSlug()).toBe("antiga");
    expect(order).toEqual([]);
    expect(deps.selectBusiness).not.toHaveBeenCalled();
  });

  test.each([
    ["sem tokens", { ...LOGIN, tokens: undefined }],
    ["loja fora do formato", { ...LOGIN, business: { id: "b1", slug: "Loja Ruim!", name: "x" } }],
    ["sem loja", { ...LOGIN, business: undefined }],
  ])("resposta do login incompleta (%s) é recusada sem tocar no aparelho", async (name, response) => {
    const { session, storage, order } = await setup({ login: jest.fn(async () => response) });
    await expect(session.signIn("a@b.com", "x")).rejects.toMatchObject({ code: "unknown" });
    expect(storage.dump()[CUSTOMER_KEY]).toBeDefined();
    expect(storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(order).toEqual([]);
  });

  test("falha ao registrar o aparelho não derruba a entrada", async () => {
    const ctx = await setup();
    ctx.deps.registerDevice.mockRejectedValue(new Error("sem permissão"));
    await expect(ctx.session.signIn("a@b.com", "x")).resolves.toBeDefined();
  });
});

describe("signOut", () => {
  async function signedIn(options) {
    const ctx = await setup({ ...options, withCustomer: false });
    await ctx.session.signIn("a@b.com", "x");
    ctx.order.length = 0;
    return ctx;
  }

  test("apaga tokens, modo e loja e revoga a sessão com a loja explícita", async () => {
    const ctx = await signedIn();
    await ctx.session.signOut();
    expect(ctx.deps.logout).toHaveBeenCalledWith("ref-staff", "patas");
    expect(ctx.storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(ctx.staffTokens.get()).toBeNull();
    expect(await ctx.businessStore.getMode()).toBeNull();
    expect(await ctx.businessStore.getSlug()).toBeNull();
    expect(ctx.deps.resetBusiness).toHaveBeenCalled();
    expect(ctx.order).toEqual(["tira-aparelho"]);
  });

  test("sem rede: tokens, modo e loja somem do mesmo jeito", async () => {
    const ctx = await signedIn({ logout: jest.fn(async () => Promise.reject(new Error("network"))) });
    ctx.deps.unregisterDevice.mockRejectedValue(new Error("network"));
    await expect(ctx.session.signOut()).resolves.toBeUndefined();
    expect(ctx.storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(await ctx.businessStore.getMode()).toBeNull();
    expect(await ctx.businessStore.getSlug()).toBeNull();
  });

  test("não espera a resposta do servidor para sair", async () => {
    const ctx = await signedIn({ logout: jest.fn(() => new Promise(() => {})) });
    await expect(ctx.session.signOut()).resolves.toBeUndefined();
    expect(ctx.storage.dump()[STAFF_KEY]).toBeUndefined();
  });

  test("dropSession (sessão vencida ou loja que sumiu) limpa tudo sem chamar a rede", async () => {
    const ctx = await signedIn();
    await ctx.session.dropSession();
    expect(ctx.deps.logout).not.toHaveBeenCalled();
    expect(ctx.deps.unregisterDevice).not.toHaveBeenCalled();
    expect(ctx.storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(await ctx.businessStore.getMode()).toBeNull();
    expect(await ctx.businessStore.getSlug()).toBeNull();
    expect(ctx.deps.resetBusiness).toHaveBeenCalled();
  });
});

describe("enterCustomerMode", () => {
  test("entrar como cliente apaga a sessão e o aparelho da equipe e grava o modo", async () => {
    const storage = memoryStorage();
    const businessStore = createBusinessStore(storage);
    const tokens = createSessionTokens(createTokenStore(storage, { key: STAFF_KEY }), () => "patas");
    await tokens.set(tokensOf("staff"));
    await businessStore.setMode("staff");
    const unregisterDevice = jest.fn(async () => {});

    await enterCustomerMode({ businessStore, tokens, unregisterDevice });

    expect(unregisterDevice).toHaveBeenCalledTimes(1);
    expect(storage.dump()[STAFF_KEY]).toBeUndefined();
    expect(await businessStore.getMode()).toBe("customer");
  });

  test("já no modo cliente, só confirma o modo e não toca na equipe", async () => {
    const storage = memoryStorage({ [STAFF_KEY]: "{}" });
    const businessStore = createBusinessStore(storage);
    const unregisterDevice = jest.fn(async () => {});
    await enterCustomerMode({ businessStore, tokens: { clear: jest.fn() }, unregisterDevice });
    expect(unregisterDevice).not.toHaveBeenCalled();
    expect(await businessStore.getMode()).toBe("customer");
  });
});

import { ApiError } from "../api/errors";
import { normalizeSlug, decideStoreSwitch } from "../business/storeLink";

export const STAFF_LINK_NOTICE = "Saia da conta da equipe para entrar como cliente.";

// O que fazer com um link de loja: com a equipe logada, sempre ignorar (sem trocar a loja nem derrubar a sessão).
// 'select' | 'confirm' | 'none' seguem a regra de sempre do cliente.
export function decideIncomingLink(mode, currentSlug, incomingSlug) {
  if (mode === "staff") return "ignore_staff";
  return decideStoreSwitch(currentSlug, incomingSlug);
}

function validLogin(data) {
  const tokens = data && data.tokens;
  const slug = normalizeSlug(data && data.business ? data.business.slug : null);
  const ok = tokens && typeof tokens.accessToken === "string" && typeof tokens.refreshToken === "string" && data.member && slug;
  return ok ? slug : null;
}

// Entrar no modo cliente apaga a sessão e o aparelho da equipe (um modo por vez).
export async function enterCustomerMode({ businessStore, tokens, unregisterDevice }) {
  if ((await businessStore.getMode()) === "staff") {
    try {
      await unregisterDevice();
    } catch (error) {
      // sem rede: o servidor passa o token ao próximo que o registrar
    }
    await tokens.clear();
  }
  await businessStore.setMode("customer");
}

// Sessão da equipe sobre dependências injetadas (testável sem tela).
// login/logout: API da equipe; tokens: sessão da equipe; leaveCustomer: sai da loja de cliente (se houver);
// selectBusiness(slug, null, { asStaff: true }): escolhe a loja; resetBusiness: volta ao estado sem loja.
export function createStaffSession({
  login,
  logout,
  tokens,
  businessStore,
  getSlug,
  leaveCustomer,
  selectBusiness,
  resetBusiness,
  registerDevice,
  unregisterDevice,
}) {
  // Sem tokens, sem modo e sem loja, sem tocar a rede.
  async function dropSession() {
    await Promise.allSettled([tokens.clear(), businessStore.clear()]);
    resetBusiness();
  }

  return {
    dropSession,

    // Login → sai da loja de cliente (sessão, aparelho, carrinho e cache dela) → grava a sessão da equipe presa
    // à loja → modo equipe → escolhe a loja → registra o aparelho. Login recusado não mexe em nada.
    async signIn(email, password) {
      const data = await login({ email, password });
      const slug = validLogin(data);
      if (!slug) throw new ApiError("Algo deu errado. Tente de novo em instantes.", { code: "unknown" });

      await leaveCustomer();
      await tokens.setFor(slug, data.tokens);
      await businessStore.setMode("staff");
      await selectBusiness(slug, null, { asStaff: true });
      // O aparelho não trava a entrada (pedido de permissão, rede lenta) e a falha dele não é da pessoa.
      try {
        Promise.resolve(registerDevice()).catch(() => {});
      } catch (error) {
        // segue
      }
      return { member: data.member, business: data.business };
    },

    // Tira o aparelho, revoga a sessão no servidor sem esperar a rede e apaga tudo daqui.
    async signOut() {
      const slug = getSlug();
      const current = tokens.get();
      try {
        await unregisterDevice();
      } catch (error) {
        // segue
      }
      if (current && current.refreshToken && slug) {
        try {
          Promise.resolve(logout(current.refreshToken, slug)).catch(() => {});
        } catch (error) {
          // sem rede: a sessão expira sozinha no servidor
        }
      }
      await dropSession();
    },
  };
}

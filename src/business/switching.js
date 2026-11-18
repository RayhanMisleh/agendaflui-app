// Sai da loja atual: revoga a sessão no servidor (sem esperar), apaga tokens, cache da conta, carrinho e aparelho
// de push. Cada limpeza roda mesmo que outra falhe; os tokens da loja anterior nunca sobram.
export async function leaveBusiness({ http, slug, tokens, businessStore, clearCart, clearPush = async () => {} }) {
  const current = tokens.get();
  if (current && current.refreshToken && slug) {
    // X-Business explícito: quando esta requisição sair, a loja ativa já pode ter sido apagada.
    http
      .post("/auth/customer/logout", { refreshToken: current.refreshToken }, { headers: { "X-Business": slug } })
      .catch(() => {});
  }
  await Promise.allSettled([tokens.clear(), businessStore.clear(), clearCart(), clearPush()]);
}

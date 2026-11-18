// A sessão venceu (a renovação falhou): a tela volta a visitante e o carrinho da loja não fica para o próximo cliente.
export function createSessionEndHandler({ getSlug, clearCart, showGuest }) {
  return () => {
    showGuest();
    const slug = getSlug();
    if (!slug) return;
    try {
      Promise.resolve(clearCart(slug)).catch(() => {});
    } catch (error) {
      // sem armazenamento: o carrinho some quando a loja for trocada
    }
  };
}

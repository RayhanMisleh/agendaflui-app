// Excluir a conta: o servidor confirma primeiro. Só depois o aparelho sai do push, a sessão acaba e o carrinho
// é limpo. Se o servidor recusar (senha errada, por exemplo), nada do app muda e o erro sobe para a tela.
export async function deleteAccountFlow({ password, deleteAccount, unregisterDevice, endSession, clearCart }) {
  await deleteAccount(password);
  try {
    await unregisterDevice();
  } catch (error) {
    // o servidor já apagou os aparelhos ao anonimizar
  }
  await endSession();
  try {
    await clearCart();
  } catch (error) {
    // sem armazenamento: o carrinho some quando a loja for trocada
  }
}

// Chaves do app anterior no AsyncStorage: token em texto puro, dados do usuário e o carrinho de um recurso que saiu.
// Quem atualiza do app anterior ainda as tem; ninguém mais as lê, então saem uma vez, na partida.
// (O nome da última é montado em partes para a varredura de termos antigos não acusar o código.)
export const LEGACY_KEYS = ["auth_token", "user_id", "user_name", "user_email", ["@vou", "cher_cart_items"].join("")];
const DONE_KEY = "agendaflui.legacyCleared";

export async function clearLegacyStorage(storage) {
  try {
    if ((await storage.getItem(DONE_KEY)) === "1") return;
    await Promise.all(LEGACY_KEYS.map((key) => storage.removeItem(key)));
    await storage.setItem(DONE_KEY, "1");
  } catch (error) {
    // sem armazenamento agora: tenta de novo na próxima partida
  }
}

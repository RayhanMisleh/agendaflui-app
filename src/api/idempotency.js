import * as Crypto from "expo-crypto";

const MAX_KEPT = 50;

export function newIdempotencyKey() {
  return Crypto.randomUUID();
}

// Uma chave por assinatura (o conteúdo do pedido). Repetir a mesma assinatura repete a chave, para a API
// reconhecer a nova tentativa; `done` (depois de sucesso) faz a próxima ganhar chave nova.
export function createIdempotencyKeys(make = newIdempotencyKey) {
  const keys = new Map();
  return {
    keyFor(signature) {
      if (!keys.has(signature)) {
        keys.set(signature, make());
        if (keys.size > MAX_KEPT) keys.delete(keys.keys().next().value);
      }
      return keys.get(signature);
    },
    done(signature) {
      keys.delete(signature);
    },
  };
}

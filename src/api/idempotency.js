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

// A API recusou de vez (4xx, menos tempo esgotado e limite de uso): nada foi feito, então a tentativa seguinte
// é outra intenção e leva chave nova. Rede, tempo esgotado, limite e 5xx podem ter chegado ao servidor: repete a chave.
export function isFinalRejection(error) {
  const status = error && error.status;
  return Number.isInteger(status) && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

// Carrinho da loja, guardado no aparelho só por código da loja (`agendaflui.cart.<slug>`). O preço guardado é
// só para mostrar uma estimativa: o pedido leva apenas id e quantidade, e o servidor refaz os valores.
const PREFIX = "agendaflui.cart.";

export function cartKey(slug) {
  return `${PREFIX}${slug}`;
}

const listeners = new Set();

// Avisa quem mostra o carrinho (selo do cabeçalho, tela) que ele mudou.
export function subscribeCart(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(slug) {
  for (const listener of [...listeners]) {
    try {
      listener(slug);
    } catch (error) {
      // um ouvinte com defeito não derruba o carrinho
    }
  }
}

function whole(value) {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : 0;
}

function validItem(item) {
  return (
    item &&
    typeof item === "object" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.unitPriceCents === "number" &&
    item.unitPriceCents >= 0 &&
    typeof item.maxQuantity === "number" &&
    typeof item.quantity === "number" &&
    item.quantity >= 1
  );
}

function toItem(product, quantity) {
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl || (images[0] && images[0].url) || null,
    unitPriceCents: whole(product.finalPriceCents),
    maxQuantity: whole(product.maxQuantity),
    quantity,
  };
}

// storage: { getItem, setItem, removeItem } assíncrono (AsyncStorage). Tudo lê e grava no armazenamento, então
// duas telas com o mesmo carrinho nunca discordam.
export function createCart(storage, slug) {
  if (typeof slug !== "string" || slug === "") throw new Error("O carrinho precisa da loja.");
  const key = cartKey(slug);

  async function read() {
    let raw;
    try {
      raw = await storage.getItem(key);
    } catch (error) {
      return [];
    }
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(validItem) : [];
    } catch (error) {
      return [];
    }
  }

  async function write(items) {
    if (items.length === 0) await storage.removeItem(key);
    else await storage.setItem(key, JSON.stringify(items));
    notify(slug);
    return items;
  }

  return {
    items: read,

    // Soma à quantidade que já está no carrinho, até o máximo do produto. Esgotado não entra.
    async add(product, quantity = 1) {
      const qty = whole(quantity);
      const fresh = toItem(product, qty);
      if (qty < 1 || fresh.maxQuantity < 1 || !fresh.productId) return read();
      const items = await read();
      const index = items.findIndex((item) => item.productId === fresh.productId);
      if (index === -1) {
        items.push({ ...fresh, quantity: Math.min(qty, fresh.maxQuantity) });
      } else {
        items[index] = { ...fresh, quantity: Math.min(items[index].quantity + qty, fresh.maxQuantity) };
      }
      return write(items);
    },

    // 0 ou menos remove; mais que o máximo fica no máximo.
    async setQuantity(productId, quantity) {
      const qty = whole(quantity);
      const items = await read();
      const index = items.findIndex((item) => item.productId === productId);
      if (index === -1) return items;
      if (qty < 1) items.splice(index, 1);
      else items[index] = { ...items[index], quantity: Math.min(qty, items[index].maxQuantity) };
      return write(items);
    },

    async remove(productId) {
      const items = await read();
      return write(items.filter((item) => item.productId !== productId));
    },

    async clear() {
      await write([]);
    },

    async count() {
      return (await read()).reduce((sum, item) => sum + item.quantity, 0);
    },

    // Estimativa: o valor de verdade vem no pedido.
    async totalCents() {
      return (await read()).reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    },
  };
}

export async function clearCartFor(storage, slug) {
  if (typeof slug !== "string" || slug === "") return;
  await storage.removeItem(cartKey(slug));
  notify(slug);
}

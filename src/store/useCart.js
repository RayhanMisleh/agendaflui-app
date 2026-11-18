import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBusiness } from "../business/BusinessProvider";
import { createCart, subscribeCart } from "../services/cartService";

const EMPTY = { items: [], count: 0, totalCents: 0, loaded: false };

// Carrinho da loja atual: itens, quantidade, estimativa do total e as operações. Atualiza sozinho quando
// qualquer tela mexe no carrinho.
export function useCart() {
  const { slug } = useBusiness();
  const cart = useMemo(() => (slug ? createCart(AsyncStorage, slug) : null), [slug]);
  const [state, setState] = useState(EMPTY);
  const turn = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++turn.current;
    if (!cart) {
      setState({ ...EMPTY, loaded: true });
      return;
    }
    const items = await cart.items();
    if (mine !== turn.current) return;
    setState({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents: items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
      loaded: true,
    });
  }, [cart]);

  useEffect(() => {
    setState(EMPTY);
    reload();
    return subscribeCart((changed) => {
      if (changed === slug) reload();
    });
  }, [slug, reload]);

  return { ...state, cart, reload };
}

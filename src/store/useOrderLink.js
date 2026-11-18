import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { useAuth } from "../components/AuthProvider";
import { useBusiness } from "../business/BusinessProvider";
import { parseStoreLink } from "../business/storeLink";
import { ROUTES } from "../navigation/routes";

async function initialUrl() {
  if (Platform.OS === "web") return typeof window !== "undefined" ? window.location.href : null;
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    return null;
  }
}

// Link de pedido (`/<loja>/pedidos/<id>`, na web é a volta do Mercado Pago): abre o pedido da loja certa assim que
// a loja está pronta e a pessoa está dentro da conta. Outra loja pede a troca antes (BusinessProvider).
export function useOrderLink(navigationRef) {
  const { status, slug, business } = useBusiness();
  const { isAuthenticated, isLoading } = useAuth();
  const [pending, setPending] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const take = (url) => {
      const link = parseStoreLink(url);
      if (link && link.orderId && !cancelled) setPending({ slug: link.slug, orderId: link.orderId });
    };
    initialUrl().then(take);
    const subscription = Linking.addEventListener("url", ({ url }) => take(url));
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pending || isLoading || !isAuthenticated || status !== "ready" || slug !== pending.slug) return undefined;
    if (!(business && business.modules && business.modules.store)) {
      setPending(null);
      return undefined;
    }
    if (!navigationRef.isReady()) {
      const timer = setTimeout(() => setTick((n) => n + 1), 150);
      return () => clearTimeout(timer);
    }
    navigationRef.navigate(ROUTES.Navigator, {
      screen: ROUTES.MeusPedidos,
      params: { screen: ROUTES.PedidoDetalhes, params: { orderId: pending.orderId }, initial: false },
    });
    // Web: o endereço do pedido já foi usado; sai da barra para não abrir de novo a cada recarga.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.history.replaceState(null, "", "/");
      } catch (error) {
        // sem history: o link só será lido de novo no próximo carregamento
      }
    }
    setPending(null);
    return undefined;
  }, [pending, isLoading, isAuthenticated, status, slug, business, navigationRef, tick]);
}

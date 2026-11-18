import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, sessionTokens, setActiveSlug, setSessionHandlers } from "../api";
import { fetchBusiness } from "../api/business";
import { clearCartFor } from "../services/cartService";
import { unregisterDevice } from "../services/notificationService";
import { createBusinessStore } from "./businessStore";
import { decideStoreSwitch, parseStoreLink, stripStoreFromAddress } from "./storeLink";
import { leaveBusiness } from "./switching";
import { termsOf } from "./terms";

const businessStore = createBusinessStore(AsyncStorage);

const inert = {
  status: "loading",
  slug: null,
  business: null,
  selectBusiness: async () => {},
  switchBusiness: async () => {},
  reload: async () => {},
};
const BusinessContext = createContext(inert);

// status: 'loading' (descobrindo a loja), 'none' (sem loja: só a tela de código), 'ready', 'unavailable'.
export function useBusiness() {
  return useContext(BusinessContext);
}

// Termos da conta (profissional, cliente, pontos, clube), sempre completos.
export function useTerms() {
  const { business } = useBusiness();
  return useMemo(() => termsOf(business), [business]);
}

function confirmSwitch(newName, currentName) {
  const message = `Trocar para ${newName}? Você sai da conta em ${currentName}.`;
  if (Platform.OS === "web") {
    return Promise.resolve(typeof window !== "undefined" && window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert(
      "Trocar de loja",
      message,
      [
        { text: "Ficar", style: "cancel", onPress: () => resolve(false) },
        { text: "Trocar", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

async function initialUrl() {
  if (Platform.OS === "web") return typeof window !== "undefined" ? window.location.href : null;
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    return null;
  }
}

export function BusinessProvider({ children }) {
  const [state, setState] = useState({ status: "loading", slug: null, business: null });
  const current = useRef(state);

  const apply = useCallback((next) => {
    current.current = next;
    setActiveSlug(next.slug);
    setState(next);
  }, []);

  // Busca os dados da conta de novo; o cache serve enquanto isso e se a rede falhar.
  const refresh = useCallback(async (slug) => {
    try {
      const business = await fetchBusiness(api.http, slug);
      if (current.current.slug !== slug) return;
      await businessStore.setCached(business);
      apply({ status: "ready", slug, business });
    } catch (error) {
      if (current.current.slug !== slug) return;
      // Código que deixou de existir: o cliente da API já chamou onBusinessGone.
      if (error.reason === "unknown_business") return;
      const hasCache = current.current.business !== null && error.code !== "business_unavailable";
      if (!hasCache) apply({ status: "unavailable", slug, business: current.current.business });
    }
  }, [apply]);

  const leave = useCallback(async () => {
    const slug = current.current.slug;
    if (!slug) return;
    await leaveBusiness({
      http: api.http,
      slug,
      tokens: sessionTokens,
      businessStore,
      clearCart: () => clearCartFor(AsyncStorage, slug), // o carrinho é da loja que a pessoa deixa
      clearPush: unregisterDevice, // o aparelho sai da loja antes de a sessão acabar
    });
  }, []);

  const adopt = useCallback(
    async (slug, business) => {
      await businessStore.setSlug(slug);
      if (business) await businessStore.setCached(business);
      apply({ status: business ? "ready" : "loading", slug, business: business || null });
      refresh(slug);
    },
    [apply, refresh]
  );

  const selectBusiness = useCallback(
    async (slug, business) => {
      if (current.current.slug && current.current.slug !== slug) await leave();
      await adopt(slug, business);
    },
    [adopt, leave]
  );

  const switchBusiness = useCallback(async () => {
    if (!current.current.slug) return;
    await leave();
    apply({ status: "none", slug: null, business: null });
  }, [apply, leave]);

  // Link de loja com o app aberto ou na partida: sem loja, seleciona; outra loja, confirma antes de trocar.
  const handleIncoming = useCallback(
    async (slug) => {
      const decision = decideStoreSwitch(current.current.slug, slug);
      if (decision === "none") return;
      let business;
      try {
        business = await fetchBusiness(api.http, slug);
      } catch (error) {
        return; // loja que não existe ou sem rede: o link é ignorado
      }
      if (decision === "confirm") {
        const currentName = current.current.business ? current.current.business.name : "a loja atual";
        if (!(await confirmSwitch(business.name, currentName))) return;
      }
      await selectBusiness(slug, business);
    },
    [selectBusiness]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, url] = await Promise.all([businessStore.getSlug(), initialUrl()]);
      if (cancelled) return;
      if (stored) {
        const cached = await businessStore.getCached();
        apply({ status: cached ? "ready" : "loading", slug: stored, business: cached });
        refresh(stored);
      }
      const link = parseStoreLink(url);
      if (link) await handleIncoming(link.slug);
      // Web: o `/<código>` já foi usado (ou recusado); sai da barra para não valer de novo a cada recarga.
      if (Platform.OS === "web" && typeof window !== "undefined") stripStoreFromAddress(window);
      if (!cancelled && !current.current.slug) apply({ status: "none", slug: null, business: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [apply, refresh, handleIncoming]);

  useEffect(() => {
    setSessionHandlers({ onBusinessGone: switchBusiness });
  }, [switchBusiness]);

  useEffect(() => {
    const linking = Linking.addEventListener("url", ({ url }) => {
      const link = parseStoreLink(url);
      if (link) handleIncoming(link.slug);
    });
    const appState = AppState.addEventListener("change", (next) => {
      if (next === "active" && current.current.slug) refresh(current.current.slug);
    });
    return () => {
      linking.remove();
      appState.remove();
    };
  }, [handleIncoming, refresh]);

  const reload = useCallback(async () => {
    const slug = current.current.slug;
    if (!slug) return;
    apply({ ...current.current, status: current.current.business ? "ready" : "loading" });
    await refresh(slug);
  }, [apply, refresh]);

  const value = useMemo(
    () => ({ ...state, selectBusiness, switchBusiness, reload }),
    [state, selectBusiness, switchBusiness, reload]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, sessionTokens, setSessionHandlers } from "../api";
import { useBusiness } from "../business/BusinessProvider";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Sessão do cliente na loja atual. A sessão só vale para a loja em que os tokens foram gravados.
export const AuthProvider = ({ children }) => {
  const { slug, status } = useBusiness();
  const [session, setSession] = useState({ slug: null, authenticated: false, customer: null });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setSession({ slug: null, authenticated: false, customer: null });
      return undefined;
    }
    sessionTokens.load(slug).then((tokens) => {
      if (!cancelled) setSession({ slug, authenticated: Boolean(tokens), customer: null });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // A renovação falhou: o cliente da API já apagou os tokens; aqui só a tela volta a visitante.
  useEffect(() => {
    setSessionHandlers({
      onSessionEnded: () => setSession((s) => ({ ...s, authenticated: false, customer: null })),
    });
  }, []);

  const startSession = useCallback(
    async ({ tokens, customer }) => {
      await sessionTokens.set(tokens);
      setSession({ slug, authenticated: true, customer: customer || null });
    },
    [slug]
  );

  const endSession = useCallback(async () => {
    const tokens = sessionTokens.get();
    if (tokens && tokens.refreshToken && slug) {
      // sem esperar: sair não depende da rede (X-Business explícito, a loja pode mudar logo em seguida)
      api.http
        .post("/auth/customer/logout", { refreshToken: tokens.refreshToken }, { headers: { "X-Business": slug } })
        .catch(() => {});
    }
    await sessionTokens.clear();
    setSession({ slug, authenticated: false, customer: null });
  }, [slug]);

  const settled = session.slug === slug;
  const value = useMemo(
    () => ({
      isAuthenticated: settled && session.authenticated,
      isLoading: status === "loading" || (slug !== null && !settled),
      customer: settled ? session.customer : null,
      startSession,
      endSession,
      // Nomes antigos que as telas de entrada e o perfil ainda usam até as tarefas 3 e 4.
      login: () => {},
      logout: endSession,
    }),
    [settled, session, status, slug, startSession, endSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { staffSessionTokens, setStaffSessionHandlers } from "./api";
import { staffLogin, staffLogout, getStaffMe } from "../api/staff";
import { useBusiness } from "../business/BusinessProvider";
import { createBusinessStore } from "../business/businessStore";
import { registerDevice, unregisterDevice } from "../services/notificationService";
import { createStaffSession } from "./session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveSlug } from "../api";

const businessStore = createBusinessStore(AsyncStorage);

const inert = {
  status: "loading",
  member: null,
  profile: null,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
};
const StaffSessionContext = createContext(inert);

// status: 'loading' (lendo a sessão), 'none' (fora do modo equipe), 'ready' (equipe logada na loja escolhida).
export function useStaffSession() {
  return useContext(StaffSessionContext);
}

function memberOf(profile) {
  return {
    userId: profile.userId,
    membershipId: profile.membershipId,
    name: profile.name,
    role: profile.role,
    professionalId: profile.professionalId,
  };
}

export function StaffSessionProvider({ children }) {
  const { slug, mode, selectBusiness, switchBusiness, resetStore } = useBusiness();
  const [state, setState] = useState({ status: "loading", slug: null, member: null, profile: null });
  const stateRef = useRef(state);
  stateRef.current = state;

  const session = useMemo(
    () =>
      createStaffSession({
        login: staffLogin,
        logout: staffLogout,
        tokens: staffSessionTokens,
        businessStore,
        getSlug: getActiveSlug,
        leaveCustomer: switchBusiness,
        selectBusiness,
        resetBusiness: resetStore,
        registerDevice: () => registerDevice({ target: "staff" }),
        unregisterDevice: () => unregisterDevice({ target: "staff" }),
      }),
    [switchBusiness, selectBusiness, resetStore]
  );

  const refreshProfile = useCallback(async () => {
    const forSlug = getActiveSlug();
    try {
      const profile = await getStaffMe();
      if (getActiveSlug() !== forSlug) return;
      setState((s) => ({ ...s, profile, member: memberOf(profile) }));
    } catch (error) {
      // sem rede: a tela segue com o que já tem; sessão vencida o cliente da API já tratou
    }
  }, []);

  // Sessão vencida ou loja que sumiu: o cliente da API já apagou o que podia; aqui some o resto.
  useEffect(() => {
    const end = () => {
      session.dropSession();
    };
    setStaffSessionHandlers({ onSessionEnded: end, onBusinessGone: end });
  }, [session]);

  // Modo equipe com loja escolhida: lê a sessão guardada e busca o perfil. Sem sessão, o modo não vale.
  useEffect(() => {
    if (mode !== "staff") {
      setState({ status: "none", slug: null, member: null, profile: null });
      return undefined;
    }
    if (!slug) return undefined;
    if (stateRef.current.status === "ready" && stateRef.current.slug === slug) return undefined;
    let cancelled = false;
    (async () => {
      const tokens = await staffSessionTokens.load(slug);
      if (cancelled) return;
      if (!tokens) {
        await session.dropSession();
        return;
      }
      setState((s) => ({ status: "ready", slug, member: s.member, profile: null }));
      refreshProfile();
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, slug, session, refreshProfile]);

  const signIn = useCallback(
    async (email, password) => {
      const result = await session.signIn(email, password);
      setState((s) => ({ ...s, status: "ready", slug: result.business.slug, member: result.member }));
      refreshProfile();
      return result;
    },
    [session, refreshProfile]
  );

  const value = useMemo(
    () => ({
      status: state.status,
      member: state.member,
      profile: state.profile,
      signIn,
      signOut: session.signOut,
      refreshProfile,
    }),
    [state, signIn, session, refreshProfile]
  );

  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>;
}


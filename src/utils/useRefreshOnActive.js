import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { subscribeAppActive } from "./appActive";

// Busca de novo quando o app volta ao primeiro plano com a tela focada (no Android, o navegador do pagamento
// fecha sem a tela perder o foco). `isFocused` vem da navegação.
export function useRefreshOnActive(refresh, isFocused) {
  const latest = useRef({ refresh, isFocused });
  latest.current = { refresh, isFocused };
  useEffect(
    () =>
      subscribeAppActive(AppState, () => {
        const { refresh: run, isFocused: focused } = latest.current;
        if (!focused || focused()) run();
      }),
    []
  );
}

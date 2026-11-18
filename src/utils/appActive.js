// Chama `onActive` quando o app volta ao primeiro plano (de background ou, no iOS, de inactive).
// `appState` é o AppState do react-native (injetável nos testes). Devolve a função que cancela a escuta.
export function subscribeAppActive(appState, onActive) {
  let previous = appState.currentState;
  const subscription = appState.addEventListener("change", (next) => {
    const returned = next === "active" && previous !== "active";
    previous = next;
    if (returned) onActive();
  });
  return () => subscription.remove();
}

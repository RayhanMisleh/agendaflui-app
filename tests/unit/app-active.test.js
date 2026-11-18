import { subscribeAppActive } from "../../src/utils/appActive";

function fakeAppState(initial = "active") {
  const listeners = new Set();
  return {
    currentState: initial,
    addEventListener(type, listener) {
      if (type !== "change") throw new Error("evento inesperado");
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    emit(next) {
      this.currentState = next;
      [...listeners].forEach((listener) => listener(next));
    },
    count: () => listeners.size,
  };
}

describe("subscribeAppActive", () => {
  test("chama ao voltar ao primeiro plano", () => {
    const appState = fakeAppState("active");
    const onActive = jest.fn();
    subscribeAppActive(appState, onActive);
    appState.emit("background");
    expect(onActive).not.toHaveBeenCalled();
    appState.emit("active");
    expect(onActive).toHaveBeenCalledTimes(1);
  });

  test("no iOS, inactive e depois active também conta uma vez", () => {
    const appState = fakeAppState("active");
    const onActive = jest.fn();
    subscribeAppActive(appState, onActive);
    appState.emit("inactive");
    appState.emit("active");
    expect(onActive).toHaveBeenCalledTimes(1);
  });

  test("active repetido sem sair não chama de novo", () => {
    const appState = fakeAppState("active");
    const onActive = jest.fn();
    subscribeAppActive(appState, onActive);
    appState.emit("active");
    expect(onActive).not.toHaveBeenCalled();
  });

  test("a função devolvida cancela a escuta", () => {
    const appState = fakeAppState("background");
    const onActive = jest.fn();
    const stop = subscribeAppActive(appState, onActive);
    stop();
    expect(appState.count()).toBe(0);
    appState.emit("active");
    expect(onActive).not.toHaveBeenCalled();
  });
});

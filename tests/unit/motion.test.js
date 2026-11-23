import { stackScreenOptions, pressFeedback, entranceDuration } from "../../src/utils/motion";

describe("stackScreenOptions", () => {
  test("com reduzir movimento, sem animação de pilha em nenhuma plataforma", () => {
    ["ios", "android", "web"].forEach((platform) => {
      expect(stackScreenOptions({ platform, reduceMotion: true }).animationEnabled).toBe(false);
    });
  });

  test("Android passa a animar a troca de tela", () => {
    const options = stackScreenOptions({ platform: "android", reduceMotion: false });
    expect(options.animationEnabled).toBe(true);
    expect(typeof options.cardStyleInterpolator).toBe("function");
  });

  test("iOS anima e mantém o cabeçalho escondido", () => {
    const options = stackScreenOptions({ platform: "ios", reduceMotion: false });
    expect(options.animationEnabled).toBe(true);
    expect(options.headerShown).toBe(false);
  });

  test("web esmaece de 0 a 1", () => {
    const options = stackScreenOptions({ platform: "web", reduceMotion: false });
    const progress = { interpolate: jest.fn(() => "opacidade") };
    const style = options.cardStyleInterpolator({ current: { progress } });
    expect(progress.interpolate).toHaveBeenCalledWith({ inputRange: [0, 1], outputRange: [0, 1] });
    expect(style).toEqual({ cardStyle: { opacity: "opacidade" } });
  });

  test("abrir e fechar levam 220 ms", () => {
    const { transitionSpec } = stackScreenOptions({ platform: "android", reduceMotion: false });
    expect(transitionSpec.open.config.duration).toBe(220);
    expect(transitionSpec.close.config.duration).toBe(220);
  });
});

describe("pressFeedback", () => {
  test("toque: escala e opacidade", () => {
    expect(pressFeedback(true, false)).toEqual({ opacity: 0.85, transform: [{ scale: 0.98 }] });
  });

  test("com reduzir movimento, só opacidade", () => {
    expect(pressFeedback(true, true)).toEqual({ opacity: 0.85 });
  });

  test("solto: sem estilo", () => {
    expect(pressFeedback(false, false)).toEqual({});
    expect(pressFeedback(false, true)).toEqual({});
  });
});

describe("entranceDuration", () => {
  test("entrada das telas de sucesso: 220 ms ou 0", () => {
    expect(entranceDuration(false)).toBe(220);
    expect(entranceDuration(true)).toBe(0);
  });
});

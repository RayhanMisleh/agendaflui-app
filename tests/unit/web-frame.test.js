import { webFrameStyle } from "../../src/utils/webFrame";

describe("webFrameStyle", () => {
  test("celular: largura toda", () => {
    [320, 414, 600].forEach((width) => {
      const style = webFrameStyle(width, "app");
      expect(style.width).toBe("100%");
      expect(style.maxWidth).toBeUndefined();
      expect(style.borderLeftWidth).toBeUndefined();
    });
  });

  test("computador: 480 na entrada e 800 no app, centrado", () => {
    const entry = webFrameStyle(1280, "entry");
    const app = webFrameStyle(1280, "app");
    expect(entry.maxWidth).toBe(480);
    expect(app.maxWidth).toBe(800);
    [entry, app].forEach((style) => {
      expect(style.width).toBe("100%");
      expect(style.alignSelf).toBe("center");
      expect(style.borderLeftWidth).toBe(1);
      expect(style.borderRightWidth).toBe(1);
    });
  });

  test("sem variante, vale a do app", () => {
    expect(webFrameStyle(1280).maxWidth).toBe(800);
  });
});

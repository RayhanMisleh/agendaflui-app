const PHONE_MAX = 600;
const MAX_WIDTH = { entry: 480, app: 800 };

// Até 600 px a tela ocupa tudo; acima, uma coluna centrada com borda fina (480 na entrada, 800 no app).
export function webFrameStyle(windowWidth, variant = "app") {
  if (windowWidth <= PHONE_MAX) return { flex: 1, width: "100%" };
  return {
    flex: 1,
    width: "100%",
    maxWidth: MAX_WIDTH[variant] || MAX_WIDTH.app,
    alignSelf: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
  };
}


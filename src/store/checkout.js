import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Abre o pagamento do Mercado Pago. Celular: navegador do app, a promessa resolve quando a pessoa o fecha
// (aí a tela atualiza o pedido). Web: a própria página vai ao pagamento e volta pelo `returnUrl`.
export async function openCheckout(checkoutUrl) {
  if (typeof checkoutUrl !== "string" || !/^https?:\/\//i.test(checkoutUrl.trim())) {
    throw new Error("Endereço de pagamento inválido.");
  }
  const url = checkoutUrl.trim();
  if (Platform.OS === "web") {
    window.location.assign(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

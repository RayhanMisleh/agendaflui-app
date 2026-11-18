import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

// Abre o pagamento do Mercado Pago. iOS: a promessa resolve quando a pessoa fecha o navegador. Android: resolve
// assim que ele abre; por isso as telas de pedido também buscam de novo quando o app volta ao primeiro plano. Web: a própria página vai ao pagamento e volta pelo `returnUrl`.
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

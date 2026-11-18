import { Alert, Platform } from "react-native";

// Aviso simples. No navegador o Alert do react-native-web não faz nada, então usa window.alert.
export function notify(title, message) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

// Pergunta com sim/não; resolve true só se a pessoa confirmar.
export function confirmAction({ title, message, confirmText = "Confirmar", cancelText = "Voltar", destructive = false }) {
  if (Platform.OS === "web") {
    return Promise.resolve(typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: "cancel", onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

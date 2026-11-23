import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";
import { staffApi } from "../staff/api";

// Só o token do aparelho (não é segredo de sessão) fica no AsyncStorage, para poder tirá-lo da loja ao sair.
export const PUSH_TOKEN_KEY = "agendaflui.pushToken";
export const STAFF_PUSH_TOKEN_KEY = "agendaflui.staffPushToken";

// Cada alvo (cliente ou equipe) tem o seu cliente da API, a sua rota e a sua chave: um não mexe no aparelho do outro.
const TARGETS = {
  customer: { client: () => api, path: "/me/devices", key: PUSH_TOKEN_KEY },
  staff: { client: () => staffApi, path: "/staff/devices", key: STAFF_PUSH_TOKEN_KEY },
};

// Como as notificações aparecem com o app aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function setupAndroidChannels() {
  await Notifications.setNotificationChannelAsync("appointment-reminders", {
    name: "Lembretes de agendamento",
    description: "Avisos antes dos seus horários",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0B6E66",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
  await Notifications.setNotificationChannelAsync("default", {
    name: "Avisos gerais",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0B6E66",
    sound: "default",
  });
}

// Pede permissão e devolve o ExpoPushToken. Sem aparelho de verdade, permissão ou projectId do EAS: null, sem erro.
async function getPushToken() {
  if (!Device.isDevice) return null;
  if (Platform.OS === "android") await setupAndroidChannels();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return null;

  const data = await Notifications.getExpoPushTokenAsync({ projectId });
  return data.data || null;
}

// Registra o aparelho na loja atual (o servidor aceita repetição). Nunca lança: push não pode travar o app.
export async function registerDevice({ target = "customer" } = {}) {
  const { client, path, key } = TARGETS[target] || TARGETS.customer;
  try {
    const pushToken = await getPushToken();
    if (!pushToken) return null;
    await client().http.post(path, { platform: Platform.OS, pushToken });
    await AsyncStorage.setItem(key, pushToken);
    return pushToken;
  } catch (error) {
    return null;
  }
}

// Tira o aparelho da loja atual e esquece o token. Sem token guardado, nem toca a rede.
export async function unregisterDevice({ target = "customer" } = {}) {
  const { client, path, key } = TARGETS[target] || TARGETS.customer;
  let pushToken = null;
  try {
    pushToken = await AsyncStorage.getItem(key);
  } catch (error) {
    return;
  }
  if (!pushToken) return;
  try {
    await client().http.delete(`${path}/${encodeURIComponent(pushToken)}`, { timeout: 5000 });
  } catch (error) {
    // sem rede ou sessão vencida: o servidor passa o token ao próximo cliente que o registrar
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // sem armazenamento: nada a fazer
  }
}

import * as SecureStore from "expo-secure-store";

// Chaveiro do sistema (iOS) / Keystore (Android). Só neste aparelho: fora de backup e de migração.
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key, options),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
  removeItem: (key) => SecureStore.deleteItemAsync(key, options),
};

export default secureStorage;

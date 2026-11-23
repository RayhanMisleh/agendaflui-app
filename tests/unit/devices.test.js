import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerDevice, unregisterDevice, PUSH_TOKEN_KEY } from "../../src/services/notificationService";

let mockHandler;
let mockIsDevice = true;
let mockPermission = "granted";
let mockPushToken = "ExponentPushToken[abc]";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  requestPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: mockPushToken })),
  AndroidImportance: { MAX: 5, HIGH: 4 },
}));

jest.mock("expo-device", () => ({
  get isDevice() {
    return mockIsDevice;
  },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "proj-1" } } } },
}));

jest.mock("../../src/api", () => {
  const { createApiClient } = jest.requireActual("../../src/api/client");
  const { fakeAdapter } = jest.requireActual("../helpers/fake-adapter");
  const adapter = fakeAdapter((call) => mockHandler(call));
  const client = createApiClient({
    baseURL: "https://api.test/v1",
    getSlug: () => "patas",
    tokens: { get: () => null, set: async () => {}, clear: async () => {} },
    onSessionEnded: () => {},
    onBusinessGone: () => {},
    adapter,
  });
  return { api: client, __adapter: adapter };
});

const adapter = require("../../src/api").__adapter;

beforeEach(async () => {
  adapter.calls.length = 0;
  mockHandler = async () => ({ status: 204, data: undefined });
  mockIsDevice = true;
  mockPermission = "granted";
  mockPushToken = "ExponentPushToken[abc]";
  await AsyncStorage.clear();
});

describe("unregisterDevice", () => {
  test("sem token guardado não chama a rede", async () => {
    await unregisterDevice();
    expect(adapter.calls).toHaveLength(0);
  });

  test("com token guardado apaga o aparelho no servidor e a chave", async () => {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, "ExponentPushToken[abc]");
    await unregisterDevice();
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0].method).toBe("DELETE");
    expect(adapter.calls[0].url).toBe("/me/devices/ExponentPushToken%5Babc%5D");
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });

  test("falha da rede não trava a saída e a chave some do mesmo jeito", async () => {
    mockHandler = async () => {
      throw "network";
    };
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, "ExponentPushToken[abc]");
    await expect(unregisterDevice()).resolves.toBeUndefined();
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });
});

describe("registerDevice", () => {
  test("manda a plataforma e o token e guarda o token", async () => {
    await expect(registerDevice()).resolves.toBe("ExponentPushToken[abc]");
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0].method).toBe("POST");
    expect(adapter.calls[0].url).toBe("/me/devices");
    expect(adapter.calls[0].data).toEqual({ platform: "ios", pushToken: "ExponentPushToken[abc]" });
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBe("ExponentPushToken[abc]");
  });

  test("em simulador não registra e não dá erro", async () => {
    mockIsDevice = false;
    await expect(registerDevice()).resolves.toBeNull();
    expect(adapter.calls).toHaveLength(0);
  });

  test("sem permissão não registra", async () => {
    mockPermission = "denied";
    await expect(registerDevice()).resolves.toBeNull();
    expect(adapter.calls).toHaveLength(0);
  });

  test("falha do servidor não guarda o token nem lança erro", async () => {
    mockHandler = async () => ({ status: 500, data: { error: { code: "internal", message: "x" } } });
    await expect(registerDevice()).resolves.toBeNull();
    expect(await AsyncStorage.getItem(PUSH_TOKEN_KEY)).toBeNull();
  });
});

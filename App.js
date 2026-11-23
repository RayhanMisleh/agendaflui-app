import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";

import { Platform, View, Text, StyleSheet } from "react-native";
import CodigoLojaScreen from "./src/screens/CodigoLojaScreen";
import IntroScreen from "./src/screens/IntroScreen";
import Navigator from "./src/screens/Navigator";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import RecuperarSenhaScreen from "./src/screens/RecuperarSenhaScreen";
import NewUserEmailCodeScreen from "./src/screens/NewUserEmailCodeScreen";
import ConfirmarExclusaoScreen from "./src/screens/ConfirmarExclusaoScreen";
import { AuthProvider, useAuth } from "./src/components/AuthProvider";
import { BusinessProvider, useBusiness } from "./src/business/BusinessProvider";
import LoadingScreen from "./src/components/LoadingScreen";
import Button from "./src/components/ui/Button";
import { registerDevice } from "./src/services/notificationService";
import { useOrderLink } from "./src/store/useOrderLink";
import { ThemeProvider, useTheme } from "./src/utils/ThemeContext";
import { ROUTES, initialRootRoute } from "./src/navigation/routes";
import { colors, type } from "./src/theme/tokens";
import { clearLegacyStorage } from "./src/session/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Toast from "react-native-toast-message";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

// A loja escolhida não responde (suspensa ou sem rede e sem dados guardados).
const LojaIndisponivel = () => {
  const { theme } = useTheme();
  const { reload, switchBusiness } = useBusiness();
  return (
    <View style={[styles.unavailable, { backgroundColor: theme.colors.ground }]}>
      <Text style={[styles.unavailableTitle, { color: theme.colors.ink }]}>Esta loja não está disponível agora.</Text>
      <Button title="Tentar de novo" onPress={reload} fullWidth style={styles.unavailableButton} />
      <Button title="Escolher outra loja" variant="outline" onPress={switchBusiness} fullWidth style={styles.unavailableButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  unavailable: { flex: 1, justifyContent: "center", padding: 24 },
  unavailableTitle: { ...type.h2, marginBottom: 24 },
  unavailableButton: { marginTop: 12 },
});

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { status, business } = useBusiness();
  const storeName = business ? business.name : "Agenda Flui";
  const { theme } = useTheme();
  const { isDarkMode } = theme;
  const notificationListener = useRef();
  const responseListener = useRef();

  // Volta do pagamento na web: /<loja>/pedidos/<id> abre o pedido.
  useOrderLink(navigationRef);

  // Inicializar push notifications quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // O servidor aceita o mesmo aparelho de novo; sem projectId do EAS ou em simulador, não registra e não mostra erro.
      registerDevice();

      // Listener para notificações recebidas em foreground
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          const { title, body } = notification.request.content;
          // Mostrar toast quando a notificação chegar com o app aberto
          Toast.show({
            type: "info",
            text1: storeName,
            text2: [title, body].filter(Boolean).join(": "),
            visibilityTime: 5000,
            topOffset: 60,
          });
        });

      // Listener para quando o usuário toca na notificação
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          // Aqui pode-se navegar para uma tela específica baseado no tipo
          if (data?.type === "appointment_reminder") {
            // Navegar para tela de agendamentos (tratado pelo navigation ref se necessário)
          }
        });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, storeName]);

  // Disable zoom and scroll bounce on web, and fix root background color
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        body, html, #root {
          background-color: ${colors.light.ground};
          overscroll-behavior: none;
          touch-action: pan-y;
        }
        input, textarea, select {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(style);

      let meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no');
      } else {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';
        document.head.appendChild(meta);
      }
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (status === "unavailable") {
    return <LojaIndisponivel />;
  }

  return (
    <>
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animationEnabled: Platform.OS !== 'android',
        ...(Platform.OS === 'web' && {
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          }),
        }),
      }} 
      // A pilha recomeça ao escolher ou trocar de loja: as telas mudam e a primeira tela precisa existir.
      key={status === "none" ? "sem-loja" : "com-loja"}
      initialRouteName={initialRootRoute({ platform: Platform.OS, hasBusiness: status !== "none", isAuthenticated })}
    >
      {status === "none" ? (
        <Stack.Screen name={ROUTES.CodigoLoja} component={CodigoLojaScreen} />
      ) : (
        <>
          {Platform.OS === "web" && <Stack.Screen name={ROUTES.Intro} component={IntroScreen} />}
          <Stack.Screen name={ROUTES.Navigator} component={Navigator} />
          <Stack.Screen name={ROUTES.Login} component={LoginScreen} />
          <Stack.Screen name={ROUTES.SignUp} component={SignUpScreen} />
          <Stack.Screen name={ROUTES.RecuperarSenha} component={RecuperarSenhaScreen} />
          <Stack.Screen name={ROUTES.NewUserEmailCode} component={NewUserEmailCodeScreen} />
          <Stack.Screen name={ROUTES.ConfirmarExclusao} component={ConfirmarExclusaoScreen} />
        </>
      )}
    </Stack.Navigator>
    <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
    </>
  );
};

export default function App() {
  // Uma vez na partida: tira do aparelho o que o app anterior deixou no AsyncStorage (token em texto puro, dados do usuário).
  useEffect(() => {
    clearLegacyStorage(AsyncStorage);
  }, []);

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <BusinessProvider>
        <ThemeProvider>
          <LoadingScreen />
        </ThemeProvider>
      </BusinessProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.ground }}>
      <SafeAreaProvider style={{ backgroundColor: colors.light.ground }}>
        <BusinessProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer
                ref={navigationRef}
                documentTitle={{
                  formatter: () => "Agenda Flui",
                }}
              >
                <RootNavigator />
              </NavigationContainer>

              <Toast />
            </AuthProvider>
          </ThemeProvider>
        </BusinessProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

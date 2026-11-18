import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
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
import ConfirmarExclusaoCodeScreen from "./src/screens/ConfirmarExclusaoCodeScreen";
import { AuthProvider, useAuth } from "./src/components/AuthProvider";
import { BusinessProvider, useBusiness } from "./src/business/BusinessProvider";
import LoadingScreen from "./src/components/LoadingScreen";
import Button from "./src/components/ui/Button";
import { initializeNotifications } from "./src/services/notificationService";
import { ThemeProvider, useTheme } from "./src/utils/ThemeContext";
import { ROUTES } from "./src/navigation/routes";
import { colors, type } from "./src/theme/tokens";

import Toast from "react-native-toast-message";

const Stack = createStackNavigator();

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
  const { status } = useBusiness();
  const { theme } = useTheme();
  const { isDarkMode } = theme;
  const notificationListener = useRef();
  const responseListener = useRef();

  // Inicializar push notifications quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications().catch(() => {});

      // Listener para notificações recebidas em foreground
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          const { title, body } = notification.request.content;
          // Mostrar toast quando a notificação chegar com o app aberto
          Toast.show({
            type: "info",
            text1: title || "Agenda Flui",
            text2: body || "",
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
  }, [isAuthenticated]);

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
      initialRouteName={Platform.OS === "web" && !isAuthenticated ? ROUTES.Intro : ROUTES.Navigator}
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
          <Stack.Screen name={ROUTES.ConfirmarExclusaoCode} component={ConfirmarExclusaoCodeScreen} />
        </>
      )}
    </Stack.Navigator>
    <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
    </>
  );
};

export default function App() {
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
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.ground }}>
      <SafeAreaProvider style={{ backgroundColor: colors.light.ground }}>
        <ThemeProvider>
          <BusinessProvider>
            <AuthProvider>
              <NavigationContainer
                documentTitle={{
                  formatter: () => "Agenda Flui",
                }}
              >
                <RootNavigator />
              </NavigationContainer>

              <Toast />
            </AuthProvider>
          </BusinessProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

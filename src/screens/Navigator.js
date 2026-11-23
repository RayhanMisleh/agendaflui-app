import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { View, StyleSheet, Platform, Text } from "react-native";
import { theme } from "../utils/theme";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { useReduceMotion, stackScreenOptions } from "../utils/motion";
import { useBusiness } from "../business/BusinessProvider";
import { ROUTES } from "../navigation/routes";
import Icon from "../components/ui/Icon";
import { fonts, radius } from "../theme/tokens";

// Telas
import AgendarScreen from "./agendar/AgendarScreen";
import PerfilScreen from "./perfil/PerfilScreen";
import AppointmentSuccessScreen from "./AppointmentSuccessScreen";
import HistoricoAgendamentosScreen from "./HistoricoAgendamentosScreen";
import AlterarSenhaScreen from "./AlterarSenhaScreen";
import MeusPedidosStack from "./MeusPedidosStack";
import RedemptionSuccessScreen from "./RedemptionSuccessScreen";
import MinhaJornadaScreen from "./MinhaJornadaScreen";
import ProductsStack from "./ProductsStack";
import CarrinhoScreen from "./CarrinhoScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Icon
const TabIcon = ({ name, focused, theme, styles }) => {
  const getIcon = () => {
    const color = focused ? theme.colors.onBrand : theme.colors.textMuted;
    const size = focused ? 24 : 22;

    switch (name) {
      case ROUTES.Agendar:
        return <Icon name="calendar" size={size} color={color} />;
      case ROUTES.Loja:
        return <Icon name="shopping-bag" size={size} color={color} />;
      case ROUTES.Perfil:
        return <Icon name="user" size={size} color={color} />;
      default:
        return <Icon name="help-circle" size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      {getIcon()}
    </View>
  );
};

// Bottom Tabs Navigator
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { business } = useBusiness();
  // Sem o módulo da loja ligado na conta, a aba some (sem erro).
  const storeOn = Boolean(business && business.modules && business.modules.store);

  const bottomInset = insets.bottom || 0;
  const paddingBottom = Platform.OS === "web" ? 25 : (bottomInset > 0 ? bottomInset + 4 : 10);
  const tabHeight = Platform.OS === "web" ? 95 : (60 + (bottomInset > 0 ? bottomInset + 4 : 10));

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} theme={theme} styles={styles} />
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: paddingBottom,
            height: tabHeight,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name={ROUTES.Agendar}
        component={AgendarScreen}
        options={{ tabBarLabel: "Agendar" }}
      />
      {storeOn && (
        <Tab.Screen
          name={ROUTES.Loja}
          component={ProductsStack}
          options={{ tabBarLabel: "Loja" }}
        />
      )}
      <Tab.Screen
        name={ROUTES.Perfil}
        component={PerfilScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

// Main Navigator with Stack for modals/success screens
const Navigator = () => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const styles = getStyles(theme);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <Stack.Navigator
          screenOptions={{
            ...stackScreenOptions({ platform: Platform.OS, reduceMotion }),
            cardStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name={ROUTES.MainTabs} component={MainTabs} />
          <Stack.Screen
            name={ROUTES.AppointmentSuccess}
            component={AppointmentSuccessScreen}
            options={{
              presentation: "modal",
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name={ROUTES.HistoricoAgendamentos}
            component={HistoricoAgendamentosScreen}
          />
          <Stack.Screen
            name={ROUTES.AlterarSenha}
            component={AlterarSenhaScreen}
          />
          <Stack.Screen
            name={ROUTES.MeusPedidos}
            component={MeusPedidosStack}
          />
          <Stack.Screen
            name={ROUTES.Carrinho}
            component={CarrinhoScreen}
          />
          <Stack.Screen
            name={ROUTES.RedemptionSuccess}
            component={RedemptionSuccessScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name={ROUTES.MinhaJornada}
            component={MinhaJornadaScreen}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? {
      maxWidth: 800,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: theme.colors.background,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    } : {}),
  },
  tabBar: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    paddingTop: 12,
  },
  tabBarLabel: {
    fontFamily: fonts.textSemi,
    fontSize: 11,
    marginTop: 6,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 40,
    borderRadius: radius.pill,
    marginTop: -4,
  },
  tabIconFocused: {
    backgroundColor: theme.colors.primary,
  },
});

export default Navigator;

import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { useReduceMotion, stackScreenOptions } from "../utils/motion";
import { useBusiness } from "../business/BusinessProvider";
import { ROUTES } from "../navigation/routes";
import Icon from "../components/ui/Icon";
import LoadingScreen from "../components/LoadingScreen";
import { useStaffSession } from "./StaffSessionProvider";
import AgendaEquipeScreen from "./screens/AgendaEquipeScreen";
import PerfilEquipeScreen from "./screens/PerfilEquipeScreen";
import AtendimentoScreen from "./screens/AtendimentoScreen";
import RemarcarScreen from "./screens/RemarcarScreen";
import BloquearHorarioScreen from "./screens/BloquearHorarioScreen";
import ClienteEquipeScreen from "./screens/ClienteEquipeScreen";
import { fonts, type } from "../theme/tokens";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Topo da área da equipe: logo e nome da loja (a Agenda Flui só aparece no rodapé do perfil).
function StoreHeader() {
  const { theme } = useTheme();
  const { business } = useBusiness();
  const logoUrl = business && business.brand ? business.brand.logoUrl : null;
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [logoUrl]);
  const styles = getHeaderStyles(theme);
  return (
    <SafeAreaView edges={["top"]} style={styles.wrap}>
      <View style={styles.row}>
        {logoUrl && !failed ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" onError={() => setFailed(true)} accessibilityLabel="" />
        ) : null}
        <Text style={styles.name} numberOfLines={1}>
          {business ? business.name : ""}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getHeaderStyles = (theme) =>
  StyleSheet.create({
    wrap: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 },
    logo: { width: 32, height: 32, marginRight: 10 },
    name: { ...type.bodyStrong, fontFamily: fonts.displaySemi, color: theme.colors.ink, flex: 1 },
  });

function StaffTabs() {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 12 : insets.bottom > 0 ? insets.bottom : 8;
  return (
    <View style={{ flex: 1, backgroundColor: c.ground }}>
      <StoreHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: c.brandStrong,
          tabBarInactiveTintColor: c.inkMuted,
          tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, paddingBottom: bottom, height: 56 + bottom },
          tabBarLabelStyle: { fontFamily: fonts.textSemi, fontSize: 12 },
          tabBarIcon: ({ color, size }) => <Icon name={route.name === ROUTES.AgendaEquipe ? "calendar" : "user"} size={size} color={color} />,
        })}
      >
        <Tab.Screen name={ROUTES.AgendaEquipe} component={AgendaEquipeScreen} options={{ tabBarLabel: "Agenda" }} />
        <Tab.Screen name={ROUTES.PerfilEquipe} component={PerfilEquipeScreen} options={{ tabBarLabel: "Perfil" }} />
      </Tab.Navigator>
    </View>
  );
}

// Área da equipe: só o dia a dia (agenda, atendimento, bloqueio, cliente, perfil). Gestão fica no painel.
export default function StaffNavigator() {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();
  const { status } = useStaffSession();
  if (status !== "ready") return <LoadingScreen />;
  return (
    <Stack.Navigator screenOptions={{ ...stackScreenOptions({ platform: Platform.OS, reduceMotion }), cardStyle: { backgroundColor: theme.colors.ground } }}>
      <Stack.Screen name={ROUTES.EquipeTabs} component={StaffTabs} />
      <Stack.Screen name={ROUTES.Atendimento} component={AtendimentoScreen} />
      <Stack.Screen name={ROUTES.Remarcar} component={RemarcarScreen} />
      <Stack.Screen name={ROUTES.BloquearHorario} component={BloquearHorarioScreen} />
      <Stack.Screen name={ROUTES.ClienteEquipe} component={ClienteEquipeScreen} />
    </Stack.Navigator>
  );
}

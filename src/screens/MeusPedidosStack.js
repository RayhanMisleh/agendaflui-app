import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ROUTES } from "../navigation/routes";
import MeusPedidosScreen from "./MeusPedidosScreen";
import PedidoDetalhesScreen from "./PedidoDetalhesScreen";

const Stack = createStackNavigator();

export default function MeusPedidosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.MeusPedidosList} component={MeusPedidosScreen} />
      <Stack.Screen name={ROUTES.PedidoDetalhes} component={PedidoDetalhesScreen} />
    </Stack.Navigator>
  );
}

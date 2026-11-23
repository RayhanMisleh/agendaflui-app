import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ROUTES } from "../navigation/routes";
import MeusPedidosScreen from "./MeusPedidosScreen";
import PedidoDetalhesScreen from "./PedidoDetalhesScreen";

import { Platform } from "react-native";
import { useReduceMotion, stackScreenOptions } from "../utils/motion";

const Stack = createStackNavigator();

export default function MeusPedidosStack() {
  const reduceMotion = useReduceMotion();
  return (
    <Stack.Navigator
      screenOptions={stackScreenOptions({ platform: Platform.OS, reduceMotion })}
    >
      <Stack.Screen name={ROUTES.MeusPedidosList} component={MeusPedidosScreen} />
      <Stack.Screen name={ROUTES.PedidoDetalhes} component={PedidoDetalhesScreen} />
    </Stack.Navigator>
  );
}

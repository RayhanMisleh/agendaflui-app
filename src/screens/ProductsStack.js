import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ROUTES } from "../navigation/routes";
import ProductsScreen from "./ProductsScreen";
import SingleProductScreen from "./SingleProductScreen";
import CustomHeader from "../components/CustomHeader";

const Stack = createStackNavigator();

const ProductsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name={ROUTES.ProductsList}
        component={ProductsScreen}
        options={{
          headerShown: true,
          header: () => <CustomHeader />,
        }}
      />
      <Stack.Screen
        name={ROUTES.SingleProduct}
        component={SingleProductScreen}
        options={{
          headerShown: true,
          header: () => <CustomHeader />,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProductsStack;

import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";
import { radius } from "../../theme/tokens";

// Carregando a primeira vez: linhas de esqueleto no lugar da lista.
const ListSkeleton = ({ rows = 4, height = 96, style }) => (
  <View style={[styles.list, style]} accessibilityRole="progressbar" accessibilityLabel="Carregando">
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} width="100%" height={height} style={styles.row} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { borderRadius: radius.lg, marginBottom: 12 },
});

export default ListSkeleton;

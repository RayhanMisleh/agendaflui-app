import React from "react";
import { Linking, StyleSheet, View } from "react-native";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { useTheme } from "../../utils/ThemeContext";
import { config } from "../../config";

// Botões das lojas de aplicativos; só aparecem os que têm endereço https no build.
export default function StoreBadges({ style }) {
  const { theme } = useTheme();
  const items = [
    { url: config.appStoreUrl, title: "Baixar na App Store" },
    { url: config.playStoreUrl, title: "Baixar no Google Play" },
  ].filter((item) => item.url);

  if (items.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {items.map((item) => (
        <Button
          key={item.title}
          title={item.title}
          variant="outline"
          fullWidth
          icon={<Icon name="download" size={18} color={theme.colors.brandText} />}
          onPress={() => Linking.openURL(item.url).catch(() => {})}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12 },
});

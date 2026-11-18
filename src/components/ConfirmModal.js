import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, TouchableWithoutFeedback } from "react-native";
import Icon from "./ui/Icon";
import { useTheme } from "../utils/ThemeContext";
import { fonts, radius, type } from "../theme/tokens";

// Confirmação em janela: título, texto e dois botões. `destructive` pinta a ação de vermelho.
export default function ConfirmModal({
  visible,
  title = "Confirmar",
  message = "Quer continuar?",
  confirmText = "Confirmar",
  cancelText = "Voltar",
  destructive = false,
  iconName = "alert-circle",
  onConfirm,
  onCancel,
  loading = false,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  if (!visible) return null;
  const accent = destructive ? c.danger : c.brand;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
        <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
              <View style={[styles.iconBox, { backgroundColor: destructive ? c.carameloTint : c.brandTint }]}>
                <Icon name={iconName} size={24} color={accent} />
              </View>
              <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
              <Text style={[styles.message, { color: c.inkMuted }]}>{message}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, { borderColor: c.line, backgroundColor: c.surface }]}
                  onPress={onCancel}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <Text style={[styles.buttonText, { color: c.ink }]}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { borderColor: accent, backgroundColor: accent }]}
                  onPress={onConfirm}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  {loading ? <ActivityIndicator size="small" color={c.onBrand} /> : <Text style={[styles.buttonText, { color: c.onBrand }]}>{confirmText}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, borderRadius: radius.xl, borderWidth: 1, padding: 24, alignItems: "center" },
  iconBox: { width: 52, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { ...type.h2, textAlign: "center" },
  message: { ...type.body, textAlign: "center", marginTop: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  button: { flex: 1, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonText: { fontFamily: fonts.textBold, fontSize: 15 },
});

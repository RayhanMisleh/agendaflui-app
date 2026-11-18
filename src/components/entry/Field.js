import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import Icon from "../ui/Icon";
import { fonts, radius, type } from "../../theme/tokens";

// Campo de formulário: rótulo, dica, erro em texto e, para senha, botão de mostrar.
const Field = React.forwardRef(function Field({ label, hint, error, secure = false, style, ...inputProps }, ref) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error ? styles.boxError : null]}>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={theme.colors.inkMuted}
          secureTextEntry={secure && !visible}
          accessibilityLabel={label}
          {...inputProps}
        />
        {secure ? (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Esconder senha" : "Mostrar senha"}
          >
            <Icon name={visible ? "eye-off" : "eye"} size={20} color={theme.colors.inkMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

export default Field;

const getStyles = (theme) =>
  StyleSheet.create({
    wrap: { marginBottom: 16 },
    label: { ...type.small, fontFamily: fonts.textSemi, color: theme.colors.ink, marginBottom: 8 },
    box: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: radius.sm,
    },
    boxError: { borderColor: theme.colors.danger },
    input: { ...type.body, flex: 1, color: theme.colors.ink, paddingHorizontal: 16, paddingVertical: 14 },
    toggle: { paddingHorizontal: 14, paddingVertical: 12 },
    hint: { ...type.caption, color: theme.colors.inkMuted, marginTop: 6 },
    error: { ...type.small, color: theme.colors.danger, marginTop: 6 },
  });

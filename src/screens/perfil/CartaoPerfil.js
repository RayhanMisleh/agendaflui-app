import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Field from "../../components/entry/Field";
import FormMessage from "../../components/entry/FormMessage";
import { useTheme } from "../../utils/ThemeContext";
import PointsDisplay from "../../components/ui/PointsDisplay";
import Icon from "../../components/ui/Icon";
import { updateMe } from "../../api/me";
import { pointsLabel, pointsWord } from "../../business/terms";
import { fonts, radius, type } from "../../theme/tokens";

// Foto (se a loja tem), nome, e-mail, saldo de pontos, selo do clube, loja atual e edição de nome e telefone.
// `me.avatarUrl` é só leitura na v1: sem foto, o Avatar mostra as iniciais.
export default function CartaoPerfil({ me, storeName, terms, balance, onSaved }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(me.name || "");
    setPhone(me.phone || "");
    setErrors({});
    setMessage("");
    setEditing(true);
  };

  const save = async () => {
    const found = {};
    if (!name.trim()) found.name = "Digite o seu nome.";
    setErrors(found);
    if (Object.keys(found).length > 0 || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateMe({ name: name.trim(), phone: phone.trim() === "" ? null : phone.trim() });
      onSaved(updated);
      setEditing(false);
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <Avatar source={me.avatarUrl} name={me.name} size="xl" />
      {editing ? (
        <View style={styles.form}>
          <FormMessage kind="error">{message}</FormMessage>
          <Field label="Nome" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
          <Field label="Telefone" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" />
          <Button title="Salvar" onPress={save} loading={saving} fullWidth />
          <Button title="Cancelar" variant="ghost" onPress={() => setEditing(false)} fullWidth style={{ marginTop: 6 }} />
        </View>
      ) : (
        <>
          <Text style={[styles.name, { color: c.ink }]}>{me.name}</Text>
          {me.email ? <Text style={[styles.email, { color: c.inkMuted }]}>{me.email}</Text> : null}
          {me.phoneLabel ? <Text style={[styles.email, { color: c.inkMuted }]}>{me.phoneLabel}</Text> : null}
          {typeof balance === "number" ? (
            <View style={[styles.balance, { backgroundColor: c.carameloTint, borderColor: c.line }]} accessible accessibilityLabel={`Seu saldo: ${pointsLabel(balance, terms)}`}>
              <PointsDisplay amount={balance} label={pointsWord(balance, terms)} size="lg" />
            </View>
          ) : null}
          {me.isClubMember ? (
            <View style={[styles.tag, { backgroundColor: c.brandTint }]}>
              <Icon name="award" size={14} color={c.brandStrong} />
              <Text style={[styles.tagText, { color: c.ink }]}>{terms.club}</Text>
            </View>
          ) : null}
          <Text style={[styles.store, { color: c.inkMuted }]}>Você está em {storeName}</Text>
          <Button title="Editar dados" variant="outline" size="sm" onPress={startEdit} style={{ marginTop: 14 }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, alignItems: "center", padding: 24 },
  name: { ...type.h2, marginTop: 14, textAlign: "center" },
  email: { ...type.small, marginTop: 2, textAlign: "center" },
  balance: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12 },
  tag: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 12, marginTop: 10 },
  tagText: { fontFamily: fonts.textSemi, fontSize: 12, marginLeft: 6 },
  store: { ...type.small, marginTop: 10, textAlign: "center" },
  form: { width: "100%", marginTop: 16 },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import Skeleton from "./ui/Skeleton";
import Field from "./entry/Field";
import FormMessage from "./entry/FormMessage";
import { useTheme } from "../utils/ThemeContext";
import { listAddresses, createAddress, deleteAddress, lookupPostalCode } from "../api/store";
import { addressLine, formatCep } from "../store/order";
import { confirmAction } from "../utils/dialog";
import { fonts, radius, type } from "../theme/tokens";

const BLANK = { label: "", recipientName: "", postalCode: "", street: "", number: "", complement: "", district: "", city: "", state: "" };
const REQUIRED = [
  ["recipientName", "Quem recebe?"],
  ["postalCode", "Digite o CEP."],
  ["street", "Digite a rua."],
  ["number", "Digite o número."],
  ["district", "Digite o bairro."],
  ["city", "Digite a cidade."],
  ["state", "Digite a sigla do estado."],
];

// Endereços de entrega do cliente: escolher um, cadastrar (CEP preenche o resto) ou apagar.
export default function EnderecoSelector({ selectedId, onSelect }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [addresses, setAddresses] = useState(null);
  const [failed, setFailed] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [cepNote, setCepNote] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const load = useCallback(async (preferId) => {
    setFailed(null);
    try {
      const items = await listAddresses();
      setAddresses(items);
      setShowForm(items.length === 0);
      const chosen = items.find((a) => a.id === preferId) || items.find((a) => a.isDefault) || items[0] || null;
      selectRef.current(chosen);
    } catch (error) {
      setFailed(error.message);
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    load(selectedId);
    // só na abertura: depois quem escolhe é a pessoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const set = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const changeCep = async (text) => {
    const formatted = formatCep(text);
    set("postalCode", formatted);
    setCepNote("");
    if (formatted.replace(/\D/g, "").length !== 8) return;
    setLookingUp(true);
    try {
      const result = await lookupPostalCode(formatted);
      if (result.address) {
        setForm((current) => ({
          ...current,
          street: result.address.street || current.street,
          district: result.address.district || current.district,
          city: result.address.city || current.city,
          state: result.address.state || current.state,
        }));
      } else if (result.unavailable) {
        setCepNote("Não deu para buscar o CEP agora. Digite o endereço.");
      } else {
        setCepNote("Não achamos esse CEP. Confira ou digite o endereço.");
      }
    } catch (error) {
      setCepNote(error.message);
    } finally {
      setLookingUp(false);
    }
  };

  const save = async () => {
    if (saving) return;
    const found = {};
    for (const [name, text] of REQUIRED) {
      if (!String(form[name] || "").trim()) found[name] = text;
    }
    if (form.postalCode && form.postalCode.replace(/\D/g, "").length !== 8) found.postalCode = "O CEP tem 8 números.";
    if (form.state && form.state.trim().length !== 2) found.state = "Use a sigla, como PR.";
    setErrors(found);
    setMessage("");
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      const created = await createAddress({ ...form, isDefault: !addresses || addresses.length === 0 });
      setForm(BLANK);
      setCepNote("");
      await load(created.id);
    } catch (error) {
      setErrors(error.fields || {});
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address) => {
    const ok = await confirmAction({
      title: "Apagar endereço",
      message: addressLine(address),
      confirmText: "Apagar",
      cancelText: "Voltar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAddress(address.id);
      await load(selectedId === address.id ? null : selectedId);
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (addresses === null) return <Skeleton width="100%" height={88} style={{ borderRadius: radius.lg }} />;

  return (
    <View>
      {failed ? (
        <View>
          <FormMessage kind="error">{failed}</FormMessage>
          <Button title="Tentar de novo" variant="secondary" size="sm" onPress={() => load(selectedId)} style={{ alignSelf: "flex-start" }} />
        </View>
      ) : null}

      {addresses.map((address) => {
        const selected = address.id === selectedId;
        return (
          <TouchableOpacity
            key={address.id}
            activeOpacity={0.8}
            onPress={() => onSelect(address)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.card, { backgroundColor: selected ? c.brandTint : c.surface, borderColor: selected ? c.brand : c.line }]}
          >
            <View style={[styles.radio, { borderColor: selected ? c.brand : c.inkMuted }]}>
              {selected ? <View style={[styles.radioDot, { backgroundColor: c.brand }]} /> : null}
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: c.ink }]}>
                {address.label || address.recipientName}
                {address.isDefault ? "  ·  Padrão" : ""}
              </Text>
              <Text style={[styles.cardText, { color: c.inkMuted }]}>{addressLine(address)}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(address)} accessibilityRole="button" accessibilityLabel="Apagar endereço" style={styles.trash}>
              <Icon name="trash-2" size={18} color={c.inkMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {message && !showForm ? <FormMessage kind="error">{message}</FormMessage> : null}

      {showForm ? (
        <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={[styles.formTitle, { color: c.ink }]}>Novo endereço</Text>
          {message ? <FormMessage kind="error">{message}</FormMessage> : null}
          <Field label="CEP" value={form.postalCode} onChangeText={changeCep} error={errors.postalCode} hint={lookingUp ? "Buscando o CEP..." : cepNote || undefined} keyboardType="number-pad" autoComplete="postal-code" maxLength={9} />
          <Field label="Quem recebe" value={form.recipientName} onChangeText={(t) => set("recipientName", t)} error={errors.recipientName} autoComplete="name" />
          <Field label="Rua" value={form.street} onChangeText={(t) => set("street", t)} error={errors.street} />
          <Field label="Número" value={form.number} onChangeText={(t) => set("number", t)} error={errors.number} />
          <Field label="Complemento (opcional)" value={form.complement} onChangeText={(t) => set("complement", t)} error={errors.complement} />
          <Field label="Bairro" value={form.district} onChangeText={(t) => set("district", t)} error={errors.district} />
          <Field label="Cidade" value={form.city} onChangeText={(t) => set("city", t)} error={errors.city} />
          <Field label="Estado (sigla)" value={form.state} onChangeText={(t) => set("state", t.toUpperCase())} error={errors.state} autoCapitalize="characters" maxLength={2} />
          <Field label="Apelido (opcional)" hint="Por exemplo, Casa ou Trabalho." value={form.label} onChangeText={(t) => set("label", t)} error={errors.label} />
          <Button title="Salvar endereço" onPress={save} loading={saving} fullWidth />
          {addresses.length > 0 ? <Button title="Cancelar" variant="ghost" onPress={() => { setShowForm(false); setMessage(""); }} fullWidth style={{ marginTop: 6 }} /> : null}
        </View>
      ) : (
        <Button title="Novo endereço" variant="outline" size="sm" icon={<Icon name="plus" size={16} color={c.brand} />} onPress={() => setShowForm(true)} style={{ alignSelf: "flex-start", marginTop: 4 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20 },
  cardText: { ...type.small, marginTop: 2 },
  trash: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  form: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginTop: 4 },
  formTitle: { ...type.h2, marginBottom: 12 },
});

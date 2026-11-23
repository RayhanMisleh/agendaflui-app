import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { createTimeBlock, listStaffProfessionals } from "../../api/staff";
import { useBusiness, useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { localDateIn } from "../../utils/time";
import { useStaffSession } from "../StaffSessionProvider";
import { canFilterProfessionals } from "../agenda";
import { blockInput, dayStrip } from "../forms";
import ScreenHeader from "../components/ScreenHeader";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Field from "../../components/entry/Field";
import FormMessage from "../../components/entry/FormMessage";
import { fonts, radius, type } from "../../theme/tokens";

// Bloquear horário: o profissional fica sem agenda num trecho do dia. O próprio profissional só bloqueia a si mesmo.
export default function BloquearHorarioScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute();
  const { business } = useBusiness();
  const terms = useTerms();
  const { profile } = useStaffSession();
  const styles = getStyles(theme);
  const timeZone = business && business.timeZone ? business.timeZone : "America/Sao_Paulo";
  const canChoose = canFilterProfessionals(profile);
  const ownId = profile ? profile.professionalId : null;

  const [professionals, setProfessionals] = useState([]);
  const [professionalId, setProfessionalId] = useState((params && params.professionalId) || ownId || "");
  const [date, setDate] = useState((params && params.date) || localDateIn(timeZone, new Date()));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [affected, setAffected] = useState(0);
  const [saved, setSaved] = useState(false);

  // Sem escolha (perfil de profissional), vale o próprio; o perfil pode chegar depois da tela.
  useEffect(() => {
    if (!canChoose && ownId) setProfessionalId(ownId);
  }, [canChoose, ownId]);

  useEffect(() => {
    if (!canChoose) return undefined;
    let cancelled = false;
    listStaffProfessionals()
      .then((items) => {
        if (!cancelled) setProfessionals(items.filter((p) => !p.archived));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canChoose]);

  const today = localDateIn(timeZone, new Date());
  const days = React.useMemo(() => dayStrip(today, date), [today, date]);

  const submit = async () => {
    if (saving) return;
    const result = blockInput({ professionalId, date, start, end, reason });
    if (!result.ok) {
      setFieldErrors(result.fields);
      setError("");
      return;
    }
    setFieldErrors({});
    setError("");
    setSaving(true);
    try {
      const created = await createTimeBlock(result.body);
      const count = created && created.affectedAppointments ? created.affectedAppointments : 0;
      if (count > 0) {
        setAffected(count);
        setSaved(true);
      } else {
        Toast.show({ type: "success", text1: "Horário bloqueado." });
        navigation.goBack();
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const noAgenda = !canChoose && !ownId;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Bloquear horário" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {saved ? (
          <>
            <FormMessage kind="info">{`O bloqueio cobre ${affected} ${affected === 1 ? "atendimento marcado" : "atendimentos marcados"}. ${affected === 1 ? "Ele continua" : "Eles continuam"} na agenda.`}</FormMessage>
            <Button title="Voltar à agenda" onPress={() => navigation.goBack()} />
          </>
        ) : noAgenda ? (
          <FormMessage kind="info">Sua conta não tem agenda própria. Peça a quem gerencia a loja para bloquear o horário.</FormMessage>
        ) : (
          <>
            {error ? <FormMessage kind="error">{error}</FormMessage> : null}
            {canChoose ? (
              <View style={styles.group}>
                <Text style={styles.label}>{terms.professional.singular}</Text>
                <View style={styles.chips}>
                  {professionals.map((p) => (
                    <Chip key={p.id} label={p.name} size="sm" selected={professionalId === p.id} onPress={() => setProfessionalId(p.id)} />
                  ))}
                </View>
                {fieldErrors.professionalId ? <Text style={styles.error}>{fieldErrors.professionalId}</Text> : null}
              </View>
            ) : null}
            <View style={styles.group}>
              <Text style={styles.label}>Dia</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} keyboardShouldPersistTaps="handled">
                {days.map((item) => {
                  const selected = item.date === date;
                  return (
                    <Pressable
                      key={item.date}
                      onPress={() => setDate(item.date)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.weekday}, ${item.day} de ${item.month}`}
                      accessibilityState={{ selected }}
                      style={[styles.day, selected ? styles.daySelected : null]}
                    >
                      <Text style={[styles.dayWeek, selected ? styles.dayTextSelected : null]}>{item.weekday}</Text>
                      <Text style={[styles.dayNumber, selected ? styles.dayTextSelected : null]}>{item.day}</Text>
                      <Text style={[styles.dayWeek, selected ? styles.dayTextSelected : null]}>{item.month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {fieldErrors.date ? <Text style={styles.error}>{fieldErrors.date}</Text> : null}
            </View>
            <Field label="Início" value={start} onChangeText={setStart} placeholder="09:00" error={fieldErrors.start} autoCorrect={false} keyboardType="numbers-and-punctuation" />
            <Field label="Fim" value={end} onChangeText={setEnd} placeholder="10:00" hint="Use 24:00 para ir até o fim do dia." error={fieldErrors.end} autoCorrect={false} keyboardType="numbers-and-punctuation" />
            <Field label="Motivo (opcional)" value={reason} onChangeText={setReason} maxLength={200} error={fieldErrors.reason} />
            <Button title="Bloquear horário" loading={saving} onPress={submit} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    content: { padding: 20, paddingBottom: 40 },
    group: { marginBottom: 16 },
    label: { ...type.small, color: theme.colors.ink, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    days: { gap: 8, paddingVertical: 2 },
    day: { width: 56, paddingVertical: 8, alignItems: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface },
    daySelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    dayWeek: { ...type.caption, color: theme.colors.inkMuted },
    dayNumber: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 26, color: theme.colors.ink },
    dayTextSelected: { color: theme.colors.onBrand },
    error: { ...type.small, color: theme.colors.danger, marginTop: 6 },
  });

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getStaffAppointment, freeSlots, listStaffProfessionals, rescheduleStaffAppointment } from "../../api/staff";
import { useBusiness, useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { localDateIn, formatDay, addDays } from "../../utils/time";
import { useStaffSession } from "../StaffSessionProvider";
import { canFilterProfessionals } from "../agenda";
import ScreenHeader from "../components/ScreenHeader";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Icon from "../../components/ui/Icon";
import Skeleton from "../../components/ui/Skeleton";
import FormMessage from "../../components/entry/FormMessage";
import { radius, type } from "../../theme/tokens";

// Remarcar: novo dia, profissional (só para quem vê todas as agendas) e um horário livre.
export default function RemarcarScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation();
  const { params } = useRoute();
  const appointmentId = params ? params.appointmentId : null;
  const { business } = useBusiness();
  const terms = useTerms();
  const { profile } = useStaffSession();
  const styles = getStyles(theme);
  const timeZone = business && business.timeZone ? business.timeZone : "America/Sao_Paulo";
  const today = localDateIn(timeZone, new Date());
  const canChoose = canFilterProfessionals(profile);

  const [appt, setAppt] = useState(null);
  const [date, setDate] = useState(today);
  const [professionalId, setProfessionalId] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const slotsRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getStaffAppointment(appointmentId)
      .then((data) => {
        if (cancelled) return;
        setAppt(data);
        setProfessionalId(data.professional ? data.professional.id : null);
        if (data.local && data.local.date >= today) setDate(data.local.date);
      })
      .catch((failure) => {
        if (!cancelled) setLoadError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [appointmentId, today]);

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

  const loadSlots = useCallback(async () => {
    if (!appt) return;
    const request = ++slotsRequest.current;
    setLoadingSlots(true);
    setSelected(null);
    try {
      const data = await freeSlots({
        date,
        serviceIds: (appt.items || []).map((service) => service.serviceId),
        professionalId: professionalId || undefined,
      });
      if (request === slotsRequest.current) {
        setSlots(data.slots || []);
        setError("");
      }
    } catch (failure) {
      if (request === slotsRequest.current) {
        setSlots([]);
        setError(failure.message);
      }
    } finally {
      if (request === slotsRequest.current) setLoadingSlots(false);
    }
  }, [appt, date, professionalId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const confirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError("");
    try {
      // Sem permissão de escolher, o servidor mantém o profissional do atendimento.
      await rescheduleStaffAppointment(appointmentId, canChoose ? { startsAt: selected.startsAt, professionalId } : { startsAt: selected.startsAt });
      Toast.show({ type: "success", text1: "Atendimento remarcado." });
      navigation.goBack();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Remarcar" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadError ? (
          <>
            <FormMessage kind="error">{loadError}</FormMessage>
            <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            {error ? <FormMessage kind="error">{error}</FormMessage> : null}
            <Text style={styles.label}>Dia</Text>
            <View style={styles.nav}>
              <TouchableOpacity
                onPress={() => setDate(addDays(date, -1))}
                disabled={date <= today}
                style={[styles.navButton, date <= today && styles.disabled]}
                accessibilityRole="button"
                accessibilityLabel="Dia anterior"
              >
                <Icon name="chevron-left" size={22} color={c.ink} />
              </TouchableOpacity>
              <Text style={styles.date}>{formatDay(date)}</Text>
              <TouchableOpacity onPress={() => setDate(addDays(date, 1))} style={styles.navButton} accessibilityRole="button" accessibilityLabel="Próximo dia">
                <Icon name="chevron-right" size={22} color={c.ink} />
              </TouchableOpacity>
            </View>

            {canChoose && professionals.length > 0 ? (
              <>
                <Text style={styles.label}>{terms.professional.singular}</Text>
                <View style={styles.chips}>
                  {professionals.map((p) => (
                    <Chip key={p.id} label={p.name} size="sm" selected={professionalId === p.id} onPress={() => setProfessionalId(p.id)} />
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.label}>Horários livres</Text>
            {!appt || loadingSlots ? (
              <View style={styles.chips}>
                {[1, 2, 3, 4, 5, 6].map((key) => (
                  <Skeleton key={key} width={76} height={44} style={{ borderRadius: radius.pill }} />
                ))}
              </View>
            ) : slots.length === 0 ? (
              <Text style={styles.empty}>Não há horário livre neste dia. Escolha outro dia.</Text>
            ) : (
              <View style={styles.chips}>
                {slots.map((slot) => {
                  const on = selected && selected.startsAt === slot.startsAt;
                  return (
                    <TouchableOpacity
                      key={slot.startsAt}
                      activeOpacity={0.7}
                      onPress={() => setSelected(slot)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: Boolean(on) }}
                      style={[styles.slot, { backgroundColor: on ? c.brand : c.surface, borderColor: on ? c.brand : c.line }]}
                    >
                      <Text style={[styles.slotLabel, { color: on ? c.onBrand : c.ink }]}>{slot.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Button
              title={selected ? `Remarcar para ${selected.label}` : "Escolha um horário"}
              loading={saving}
              disabled={!selected}
              onPress={confirm}
              style={styles.confirm}
            />
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
    label: { ...type.caption, color: theme.colors.inkMuted, marginBottom: 8, marginTop: 8 },
    nav: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    navButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    disabled: { opacity: 0.4 },
    date: { ...type.bodyStrong, color: theme.colors.ink, textTransform: "capitalize", flex: 1, textAlign: "center" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    empty: { ...type.body, color: theme.colors.inkMuted, marginBottom: 12 },
    slot: { minWidth: 76, height: 44, borderWidth: 1, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
    slotLabel: { ...type.time },
    confirm: { marginTop: 16 },
  });

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { useReduceMotion, entranceDuration } from "../utils/motion";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import Icon from "../components/ui/Icon";
import Card from "../components/ui/Card";
import { fonts, radius, type } from "../theme/tokens";
import { formatDay } from "../utils/time";
import { formatCents } from "../utils/money";
import { useBusiness, useTerms } from "../business/BusinessProvider";
import { pointsLabel } from "../business/terms";

// Recebe o agendamento da v1 (data e hora já vêm no fuso da loja).
const AppointmentSuccessScreen = ({ navigation }) => {
  const route = useRoute();
  const { business } = useBusiness();
  const terms = useTerms();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;

  const appointment = route.params?.appointment || null;
  const isReschedule = Boolean(route.params?.isReschedule);
  const pending = appointment && appointment.status === "PENDING";
  // Pontos que o atendimento rende (soma dos serviços, calculada na hora de agendar); só com o módulo ligado.
  const rewardPoints = Number(route.params?.rewardPoints) || 0;
  const showReward = Boolean(business && business.modules && business.modules.loyalty) && !isReschedule && rewardPoints > 0;

  useEffect(() => {
    // Entra com opacidade e um deslocamento curto; com "reduzir movimento", já aparece pronta.
    Animated.timing(enter, { toValue: 1, duration: entranceDuration(reduceMotion), easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter, reduceMotion]);
  const rise = { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] };

  const title = isReschedule ? "Horário trocado" : pending ? "Agendamento enviado" : "Agendamento feito";
  const subtitle = pending ? "A loja vai confirmar o seu horário." : isReschedule ? "O novo horário já está salvo." : "Seu horário está reservado.";

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.ground }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.badge, { backgroundColor: c.brand, ...rise }]}>
          <Icon name="check" size={52} color={c.onBrand} />
        </Animated.View>
        <Animated.View style={{ ...rise, alignItems: "center", width: "100%" }}>
          <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: c.inkMuted }]}>{subtitle}</Text>

          {appointment ? (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Icon name="calendar" size={20} color={c.brand} />
                <Text style={[styles.rowText, { color: c.ink }]}>{formatDay(appointment.local.date)}</Text>
              </View>
              <View style={styles.row}>
                <Icon name="clock" size={20} color={c.brand} />
                <Text style={[styles.rowText, styles.time, { color: c.ink }]}>{appointment.local.start}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: c.line }]} />
              <View style={styles.row}>
                <Avatar name={appointment.professional.name} size="lg" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.small, { color: c.inkMuted }]}>Quem atende</Text>
                  <Text style={[styles.pro, { color: c.ink }]}>{appointment.professional.name}</Text>
                  <Text style={[styles.small, { color: c.inkMuted }]}>
                    {appointment.items.map((item) => item.name).join(", ")} · {formatCents(appointment.totalCents)}
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {showReward ? (
            <View style={[styles.reward, { backgroundColor: c.carameloTint, borderColor: c.line }]}>
              <Icon name="star" size={18} color={c.ink} />
              <Text style={[styles.rewardText, { color: c.ink }]}>
                +{pointsLabel(rewardPoints, terms)} quando o atendimento for concluído
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 24, opacity: enter }]}>
        <Button title="Voltar ao início" onPress={() => navigation.goBack()} fullWidth size="lg" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  badge: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  title: { ...type.title, textAlign: "center" },
  subtitle: { ...type.body, marginTop: 8, textAlign: "center" },
  card: { width: "100%", marginTop: 28, padding: 18 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rowText: { ...type.bodyStrong, marginLeft: 10, textTransform: "capitalize" },
  time: { ...type.time, fontSize: 16, textTransform: "none" },
  divider: { height: 1, marginVertical: 6, marginBottom: 14 },
  small: { ...type.small },
  pro: { fontFamily: fonts.textBold, fontSize: 17, lineHeight: 22 },
  reward: { width: "100%", flexDirection: "row", alignItems: "center", marginTop: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  rewardText: { ...type.small, fontFamily: fonts.textSemi, flex: 1, marginLeft: 10 },
  footer: { paddingHorizontal: 24 },
});

export default AppointmentSuccessScreen;

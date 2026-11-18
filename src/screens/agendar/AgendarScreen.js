import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../utils/ThemeContext";
import { useAuth } from "../../components/AuthProvider";
import { useBusiness, useTerms } from "../../business/BusinessProvider";
import { createIdempotencyKeys } from "../../api/idempotency";
import {
  listServices,
  listProfessionals,
  availableDays,
  availableSlots,
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  nextAppointment as fetchNextAppointment,
} from "../../api/agenda";
import { getMe } from "../../api/me";
import { getMyLoyalty } from "../../api/loyalty";
import { ANY_PROFESSIONAL, servicesFor, professionalParam, buildBooking, bookingSignature } from "../../booking/selection";
import { BOOKING_STEPS } from "../../navigation/routes";
import { localDateIn, bookingRange } from "../../utils/time";
import { rewardPointsOf } from "../../loyalty/prizes";
import { confirmAction, notify } from "../../utils/dialog";
import { fonts, radius, type } from "../../theme/tokens";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Skeleton from "../../components/ui/Skeleton";
import SaldoPontos from "./SaldoPontos";
import Banners from "./Banners";
import Premios from "./Premios";
import ProximoHorario from "./ProximoHorario";
import EscolhaProfissional from "./EscolhaProfissional";
import EscolhaServico from "./EscolhaServico";
import EscolhaData from "./EscolhaData";
import EscolhaHorario from "./EscolhaHorario";
import ResumoReserva from "./ResumoReserva";

const SLOT_GONE = ["slot_taken", "slot_unavailable"];

// Dona do estado e da ordem dos passos (BOOKING_STEPS); as seções são componentes.
const AgendarScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const { isAuthenticated } = useAuth();
  const { business, slug } = useBusiness();
  const terms = useTerms();
  const keys = useRef(createIdempotencyKeys()).current;
  const scrollRef = useRef(null);
  const daysRequest = useRef(0);
  const slotsRequest = useRef(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [me, setMe] = useState(null);
  const [balance, setBalance] = useState(null); // saldo de pontos; null: visitante ou ainda não chegou
  const [reloadKey, setReloadKey] = useState(0); // refaz prêmios e banners
  const [next, setNext] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [professionalId, setProfessionalId] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [days, setDays] = useState([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [date, setDate] = useState(null);
  const [availability, setAvailability] = useState(null); // { slots, totalCents, durationMin }
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(null); // agendamento que está sendo remarcado

  const timeZone = business ? business.timeZone : "America/Sao_Paulo";
  const maxAdvanceDays = business && business.rules ? business.rules.maxAdvanceDays : undefined;
  const today = localDateIn(timeZone, new Date());
  const isClubMember = Boolean(me && me.isClubMember);
  const loyaltyOn = Boolean(business && business.modules && business.modules.loyalty);
  const bannersOn = Boolean(business && business.modules && business.modules.banners);

  const resetSelection = useCallback(() => {
    setProfessionalId(null);
    setServiceId(null);
    setDays([]);
    setDate(null);
    setAvailability(null);
    setSlot(null);
    setRescheduling(null);
  }, []);

  // Saldo (só com o módulo ligado); falha ou módulo desligado deixam sem saldo, sem erro na tela.
  const loadBalance = useCallback(async () => {
    if (!isAuthenticated || !loyaltyOn) {
      setBalance(null);
      return;
    }
    try {
      const loyalty = await getMyLoyalty();
      setBalance(loyalty.balance);
    } catch (error) {
      setBalance(null);
    }
  }, [isAuthenticated, loyaltyOn]);

  const refreshLoyalty = useCallback(() => {
    setReloadKey((key) => key + 1);
    loadBalance();
  }, [loadBalance]);

  const loadAccount = useCallback(async () => {
    if (!isAuthenticated) {
      setMe(null);
      setNext(null);
      return;
    }
    const [profile, upcoming] = await Promise.all([getMe().catch(() => null), fetchNextAppointment().catch(() => null), loadBalance()]);
    setMe(profile);
    setNext(upcoming);
  }, [isAuthenticated, loadBalance]);

  const loadAll = useCallback(async () => {
    try {
      const [pros, svcs] = await Promise.all([listProfessionals(), listServices()]);
      setProfessionals(pros);
      setServices(svcs);
    } catch (error) {
      setProfessionals([]);
      setServices([]);
      notify("Não deu para carregar", error.message);
    }
    await loadAccount();
  }, [loadAccount]);

  // Outra loja ou outra sessão: começa do zero (nada de uma loja aparece na outra).
  useEffect(() => {
    let cancelled = false;
    resetSelection();
    setNext(null);
    setMe(null);
    setBalance(null);
    setLoading(true);
    loadAll().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, isAuthenticated]);

  // Dias livres para o profissional e o serviço escolhidos.
  useEffect(() => {
    setDays([]);
    setDate(null);
    setAvailability(null);
    setSlot(null);
    if (!professionalId || !serviceId || !business) return;
    const request = ++daysRequest.current;
    const { from, to } = bookingRange(timeZone, new Date(), maxAdvanceDays);
    setLoadingDays(true);
    availableDays({ from, to, serviceIds: [serviceId], professionalId: professionalParam(professionalId) })
      .then((items) => {
        if (request === daysRequest.current) setDays(items.filter((d) => d.available));
      })
      .catch(() => {
        if (request === daysRequest.current) setDays([]);
      })
      .finally(() => {
        if (request === daysRequest.current) setLoadingDays(false);
      });
  }, [professionalId, serviceId, timeZone, maxAdvanceDays]);

  const loadSlots = useCallback(() => {
    setAvailability(null);
    setSlot(null);
    if (!professionalId || !serviceId || !date) return;
    const request = ++slotsRequest.current;
    setLoadingSlots(true);
    availableSlots({ date, serviceIds: [serviceId], professionalId: professionalParam(professionalId) })
      .then((data) => {
        if (request === slotsRequest.current) setAvailability(data);
      })
      .catch(() => {
        if (request === slotsRequest.current) setAvailability({ slots: [], totalCents: 0, durationMin: 0 });
      })
      .finally(() => {
        if (request === slotsRequest.current) setLoadingSlots(false);
      });
  }, [professionalId, serviceId, date]);

  useEffect(loadSlots, [loadSlots]);

  const onRefresh = async () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
    await loadAll();
    setRefreshing(false);
  };

  // Ao voltar de um resgate (ou de outra tela), o saldo e os prêmios se atualizam.
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!loading) refreshLoyalty();
    });
    return unsubscribe;
  }, [navigation, loading, refreshLoyalty]);

  const scrollDown = () => setTimeout(() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true }), 200);

  const pickProfessional = (id) => {
    setProfessionalId(id);
    // O serviço escolhido pode não ser deste profissional (ao remarcar ele fica como está).
    if (!rescheduling && serviceId && !servicesFor(id, professionals, services).some((s) => s.id === serviceId)) {
      setServiceId(null);
    }
    scrollDown();
  };

  const pickService = (id) => {
    setServiceId(id);
    scrollDown();
  };

  const pickDate = (value) => {
    setDate(value);
    scrollDown();
  };

  const startReschedule = () => {
    if (!next) return;
    const target = next.professional.id;
    setRescheduling(next);
    setProfessionalId(professionals.some((p) => p.id === target) ? target : ANY_PROFESSIONAL);
    setServiceId(next.items[0].serviceId);
    setTimeout(() => scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true }), 100);
  };

  const cancelReschedule = () => {
    resetSelection();
    scrollRef.current && scrollRef.current.scrollTo({ y: 0, animated: true });
  };

  const cancelNext = async () => {
    if (!next) return;
    const ok = await confirmAction({
      title: "Cancelar agendamento",
      message: "Quer cancelar o seu próximo horário?",
      confirmText: "Cancelar horário",
      cancelText: "Manter horário",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await cancelAppointment(next.id);
      await loadAccount();
      notify("Agendamento cancelado.");
    } catch (error) {
      notify("Não deu para cancelar", error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!professionalId || !serviceId || !slot || submitting) return;

    setSubmitting(true);
    const wasRescheduling = Boolean(rescheduling);
    let signature = null;
    try {
      let appointment;
      if (rescheduling) {
        appointment = await rescheduleAppointment(rescheduling.id, {
          startsAt: slot.startsAt,
          professionalId: professionalParam(professionalId),
        });
      } else {
        const booking = buildBooking({ serviceId, startsAt: slot.startsAt, professionalId });
        signature = bookingSignature(booking);
        appointment = await createAppointment(booking, keys.keyFor(signature));
        keys.done(signature);
      }
      setNext(appointment);
      resetSelection();
      const rewardPoints = !wasRescheduling && loyaltyOn && service ? rewardPointsOf([service]) : 0;
      navigation.navigate("AppointmentSuccess", { appointment, isReschedule: wasRescheduling, rewardPoints });
      if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: false });
    } catch (error) {
      if (SLOT_GONE.includes(error.reason)) {
        notify("Esse horário acabou de ser ocupado", error.message);
        loadSlots();
      } else {
        notify("Não deu para agendar", error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const professionalChoices = useMemo(
    () => (rescheduling ? professionals.filter((p) => p.serviceIds.includes(serviceId)) : professionals),
    [rescheduling, professionals, serviceId]
  );
  const serviceChoices = useMemo(
    () => servicesFor(professionalId || ANY_PROFESSIONAL, professionals, services),
    [professionalId, professionals, services]
  );
  const professional = professionals.find((p) => p.id === professionalId);
  const professionalName = professional ? professional.name : `Qualquer ${terms.professional.singular.toLowerCase()}`;
  const service = services.find((s) => s.id === serviceId);
  const readyToConfirm = Boolean(professionalId && service && date && slot);

  const steps = {
    profissional: (
      <EscolhaProfissional
        key="profissional"
        professionals={professionalChoices}
        selectedId={professionalId}
        onSelect={pickProfessional}
        title={rescheduling ? `Trocar ${terms.professional.singular.toLowerCase()}` : "Agende seu horário"}
        subtitle={`${terms.professional.plural} disponíveis`}
        terms={terms}
      />
    ),
    servico: professionalId ? (
      <EscolhaServico
        key="servico"
        services={serviceChoices}
        selectedId={serviceId}
        onSelect={pickService}
        isClubMember={isClubMember}
        terms={terms}
        locked={Boolean(rescheduling)}
      />
    ) : null,
    data:
      professionalId && serviceId ? (
        <EscolhaData key="data" days={days} selectedDate={date} onSelect={pickDate} today={today} loading={loadingDays} />
      ) : null,
    horario:
      professionalId && serviceId && date ? (
        <EscolhaHorario
          key="horario"
          slots={availability ? availability.slots : []}
          selectedStartsAt={slot ? slot.startsAt : null}
          onSelect={setSlot}
          loading={loadingSlots || !availability}
        />
      ) : null,
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.ground }]}>
        <View style={{ padding: 24 }}>
          <Skeleton width={200} height={28} style={{ marginBottom: 8 }} />
          <Skeleton width={140} height={16} style={{ marginBottom: 32 }} />
          <Skeleton width="100%" height={176} style={{ borderRadius: radius.lg, marginBottom: 16 }} />
          <Skeleton width="100%" height={96} style={{ borderRadius: radius.lg }} />
        </View>
      </View>
    );
  }

  const firstName = me && me.name ? me.name.trim().split(" ")[0] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.ground }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: readyToConfirm ? 200 : 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.brand]} tintColor={c.brand} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: c.ink }]} numberOfLines={1}>
              {isAuthenticated && firstName ? `Olá, ${firstName}` : "Olá, visitante"}
            </Text>
            <Text style={[styles.subGreeting, { color: c.inkMuted }]} numberOfLines={1}>
              {business ? `Pronto para agendar em ${business.name}?` : "Pronto para agendar?"}
            </Text>
          </View>
          {isAuthenticated ? (
            loyaltyOn ? <SaldoPontos balance={balance} terms={terms} /> : null
          ) : (
            <TouchableOpacity style={[styles.login, { backgroundColor: c.brand }]} activeOpacity={0.8} onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.loginText, { color: c.onBrand }]}>Entrar</Text>
              <Icon name="log-in" size={16} color={c.onBrand} />
            </TouchableOpacity>
          )}
        </View>

        {bannersOn ? <Banners reloadKey={reloadKey} /> : null}
        {loyaltyOn ? (
          <Premios
            navigation={navigation}
            isAuthenticated={isAuthenticated}
            balance={isAuthenticated ? balance : null}
            terms={terms}
            reloadKey={reloadKey}
            onChanged={refreshLoyalty}
          />
        ) : null}

        {next && !rescheduling ? (
          <ProximoHorario appointment={next} busy={busy} onCancel={cancelNext} onReschedule={startReschedule} />
        ) : (
          <View>
            {rescheduling ? (
              <View style={[styles.rescheduleBar, { backgroundColor: c.brandTint, borderColor: c.brand }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rescheduleTitle, { color: c.ink }]}>Trocando o horário</Text>
                  <Text style={[styles.rescheduleSub, { color: c.inkMuted }]}>Escolha o novo dia e horário.</Text>
                </View>
                <TouchableOpacity onPress={cancelReschedule} style={styles.rescheduleCancel} activeOpacity={0.7}>
                  <Text style={[styles.rescheduleCancelText, { color: c.ink }]}>Voltar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {BOOKING_STEPS.map((step) => steps[step])}
          </View>
        )}
      </ScrollView>

      {readyToConfirm ? (
        <ResumoReserva
          service={service}
          professionalName={professionalName}
          date={date}
          slot={slot}
          totalCents={availability ? availability.totalCents : service.priceCents}
          durationMin={availability ? availability.durationMin : service.durationMin}
          authenticated={isAuthenticated}
          rescheduling={Boolean(rescheduling)}
          submitting={submitting}
          onConfirm={confirm}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { ...type.title },
  subGreeting: { ...type.small, marginTop: 2 },
  login: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  loginText: { fontFamily: fonts.textBold, fontSize: 14 },
  rescheduleBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 24, marginTop: 16, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  rescheduleTitle: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20 },
  rescheduleSub: { ...type.small },
  rescheduleCancel: { paddingVertical: 8, paddingHorizontal: 14 },
  rescheduleCancelText: { fontFamily: fonts.textBold, fontSize: 14 },
});

export default AgendarScreen;

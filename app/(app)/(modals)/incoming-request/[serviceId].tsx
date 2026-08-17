import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, ScrollView, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";
import { CustomText } from "@/components/CustomText";
import { Colors } from "@/constants/Colors";
import TouchOpacity from "@/components/TouchOpacity";
import SlideToAccept from "@/components/Buttons/SlideToAccept";
import ServiceCard from "@/components/app/ServiceCard";
import { useService } from "@/contexts/ServiceContext";
import { renderMoney } from "@/utils/money";
import useRequestActions from "@/hooks/useRequestActions";
import {
  URGENT_THRESHOLD_MS,
  isImmediateRequest,
  remainingFrom,
  remainingProgress,
  requestExpiresAt,
  requestWindowMs,
} from "@/utils/requestTiming";

/**
 * Ecrã full-screen de pedido a chegar (paridade com
 * piquet_pro/lib/screens/requests/incoming_request_screen.dart).
 *
 * Não é descartável por gesto (`gestureEnabled: false` no _layout) e o back
 * de hardware é intercetado — o profissional tem de aceitar, recusar, ou
 * esperar que expire.
 *
 * NOTA: não está ligado a push notifications de propósito; a rota fica apenas
 * pronta e navegável.
 *
 * A informação de decisão (morada completa, duração estimada e observações do
 * cliente) vem toda do <ServiceCard/> usado abaixo — é a mesma peça que a lista
 * de pedidos usa, por isso os dois ecrãs mostram exatamente o mesmo.
 */
const IncomingRequestScreen = () => {
  const { t } = useTranslation();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { pendingServices, pendingServicesLoading, getPendingServices } = useService();
  const { accept, refuse, submitting } = useRequestActions();

  const item = useMemo(
    () => (pendingServices ?? []).find(s => String(s.service_id) === String(serviceId)),
    [pendingServices, serviceId],
  );

  const expiresAt = useMemo(() => (item ? requestExpiresAt(item) : 0), [item]);
  const windowMs = useMemo(() => (item ? requestWindowMs(item) : 0), [item]);
  const immediate = isImmediateRequest(item);

  const [now, setNow] = useState(() => Date.now());
  const vibratedRef = useRef(false);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/home');
  }, []);

  // Vibração forte ao abrir (expo-haptics não está instalado neste projeto).
  useEffect(() => {
    Vibration.vibrate(Platform.OS === 'android' ? [0, 400, 150, 400] : 400);
    return () => Vibration.cancel();
  }, []);

  // Aberto por push com a app fria, a lista de pedidos ainda não carregou —
  // fechar logo por `!item` matava o ecrã antes de haver dados. Pede a lista
  // e só desiste quando ela chegou mesmo e o pedido não está lá.
  const requestedRef = useRef(false);
  useEffect(() => {
    if (item || requestedRef.current) return;
    requestedRef.current = true;
    getPendingServices();
  }, [item, getPendingServices]);

  // Fecha sozinho quando a lista JÁ carregou e o pedido não está lá
  // (aceite/recusado noutro sítio, ou expirado antes de a app abrir).
  // `pendingServicesLoading` começa a true, por isso nunca fecha antes de
  // a primeira resposta chegar.
  useEffect(() => {
    if (!item && !pendingServicesLoading) close();
  }, [item, pendingServicesLoading, close]);

  // Relógio de 1s + vibração nos últimos 10 segundos.
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      const diff = expiresAt - ts;
      if (diff > 0 && diff <= URGENT_THRESHOLD_MS && !vibratedRef.current) {
        vibratedRef.current = true;
        Vibration.vibrate([0, 120, 120, 120, 120, 120]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Interceta o back de hardware (Android) enquanto o ecrã está em foco.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const remaining = expiresAt ? remainingFrom(expiresAt, now) : undefined;
  const progress = remainingProgress(expiresAt, windowMs, now);
  const expired = remaining === null;
  const urgent = !!remaining && expiresAt - now <= URGENT_THRESHOLD_MS;

  const onAccept = useCallback(async () => {
    if (!item) return;
    const ok = await accept({ scheduleId: item.schedule_id, serviceId: item.service_id });
    if (ok) close();
  }, [accept, item, close]);

  const onRefuse = useCallback(async () => {
    if (!item) return;
    const ok = await refuse(item.service_id);
    if (ok) close();
  }, [refuse, item, close]);

  if (!item) return null;

  // renderMoney, como no resto da app — o toFixed manual dava "30.00€"
  // (ponto e sem espaço) no meio de ecrãs que mostram "30,00 €".
  const priceLabel = renderMoney(item.amount_for_vendor ?? null) || '';
  const countdownLabel = remaining
    ? `${remaining.minutes}:${String(remaining.seconds).padStart(2, '0')}`
    : '0:00';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-5">
          <Feather name="bell" size={40} color={Colors.brand} />
          <CustomText color="secondary" boldness="bolder" size="subtitle" classes="mt-2 text-center">
            {t('schedules.incoming_request_title', { defaultValue: 'Novo pedido recebido' })}
          </CustomText>
          <CustomText color="muted" size="small" classes="mt-1 text-center">
            {immediate
              ? t('schedules.incoming_request_window_immediate', { defaultValue: 'Tens 60 segundos para aceitar.' })
              : t('schedules.incoming_request_window_scheduled', { defaultValue: 'Tens 20 minutos para aceitar.' })}
          </CustomText>

          {/* Contagem decrescente grande */}
          <CustomText
            color={expired ? 'danger' : urgent ? 'danger' : 'brand'}
            boldness="bolder"
            size="headline"
            classes="mt-3"
          >
            {countdownLabel}
          </CustomText>
          <View
            className="w-full rounded-full overflow-hidden mt-2"
            style={{ height: 6, backgroundColor: Colors.line }}
          >
            <View
              style={{
                height: 6,
                borderRadius: 999,
                backgroundColor: urgent || expired ? Colors.danger : Colors.brand,
                width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              }}
            />
          </View>
        </View>

        <ServiceCard
          item={item}
          scheduleFor={item.schedule ? `${item.schedule.scheduled_day}` : null}
          price={priceLabel}
          remainingTime={remaining === undefined ? undefined : remaining}
          progress={progress}
          urgent={urgent}
        >
          {expired ? (
            <View className="items-center py-2">
              <CustomText color="error" size="small">{t('schedules.times_up')}</CustomText>
            </View>
          ) : (
            <SlideToAccept
              label={t('services.service.proposal.slide_to_accept', { defaultValue: 'Deslizar para aceitar' })}
              disabled={submitting}
              onConfirm={onAccept}
            />
          )}

          <TouchOpacity
            rounded="lg"
            itemsCenter
            border
            borderColor="support_primary"
            otherClasses="py-3 mt-3"
            onPress={expired ? close : onRefuse}
          >
            <CustomText color="support_primary" boldness="medium">
              {expired ? t('schedules.close', { defaultValue: 'Fechar' }) : t('services.service.proposal.refuse')}
            </CustomText>
          </TouchOpacity>
        </ServiceCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export default IncomingRequestScreen;

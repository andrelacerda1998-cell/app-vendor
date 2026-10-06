import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, ScrollView, TouchableOpacity, Vibration, View } from "react-native";
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
  requestWindowFromServer,
  requestWindowMs,
} from "@/utils/requestTiming";
import { useAlertSound } from "@/hooks/useAlertSound";

/**
 * Ecrã full-screen de pedido a chegar (paridade com
 * piquet_pro/lib/screens/requests/incoming_request_screen.dart).
 *
 * Não é descartável por gesto (`gestureEnabled: false` no _layout) e o back
 * de hardware é intercetado — o profissional tem de aceitar, recusar, ou
 * esperar que expire.
 *
 * LIGADO A PUSH: `hooks/useNotification.tsx` abre este ecrã quando chega uma
 * notificação com `open_type: 'request'` e `open_id` — que é o que o servidor
 * envia em NewServiceAvailableNotification, MatchingInvitationNotification e
 * NewScheduledServiceNotification. (O comentário anterior dizia o contrário e
 * era falso: teria levado alguém a "ligar" um caminho que já existe.)
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

  /**
   * A FILA: os outros pedidos que estão à espera, por ordem de quem expira
   * primeiro.
   *
   * Antes isto não existia. Chegavam dois pedidos e a app mostrava um — o
   * segundo ficava invisível, sem contador e sem aviso. Pior: se o segundo
   * chegasse com o primeiro aberto, SUBSTITUÍA-O no ecrã (é a mesma rota, e o
   * `navigate` só lhe troca os parâmetros). O primeiro desaparecia debaixo dos
   * olhos, com o relógio ainda a correr, e ele nunca mais o via a não ser que
   * fosse à lista. Em dois pedidos seguidos era capaz de nem dar por a coisa
   * ter mudado.
   *
   * Ordenados por `expires_at`: quem está mais perto de morrer vem primeiro,
   * senão a fila mandava-o decidir o que ainda tinha tempo e perder o que não
   * tinha.
   */
  const fila = useMemo(() => {
    const outros = (pendingServices ?? []).filter(
      s => String(s.service_id) !== String(serviceId),
    );

    return [...outros].sort((a, b) => requestExpiresAt(a) - requestExpiresAt(b));
  }, [pendingServices, serviceId]);

  const proximo = fila[0];

  /**
   * Abrir a lista com TODOS os pedidos, este incluído.
   *
   * `replace` e não `push`: este ecrã não se deixa sair por gesto nem pelo
   * back, e deixá-lo na pilha por baixo da lista dava um ecrã bloqueado à
   * espera para reaparecer. A lista mostra os mesmos cartões, cada um com o
   * seu contador, e dali ele aceita ou recusa qualquer deles.
   */
  const verTodos = useCallback(() => {
    closingRef.current = true;
    router.replace('/(app)/(bottom-sheets)/(services)/requests');
  }, []);

  /**
   * Decidido este, salta para o seguinte em vez de fechar.
   *
   * Mandá-lo à Home e obrigá-lo a encontrar sozinho o pedido que ainda está a
   * contar era perder por desatenção o que ele não perdeu por decisão.
   */
  const seguirParaOProximo = useCallback(() => {
    if (!proximo) return false;
    router.replace(`/(app)/(modals)/incoming-request/${proximo.service_id}`);

    return true;
  }, [proximo]);

  const expiresAt = useMemo(() => (item ? requestExpiresAt(item) : 0), [item]);
  const windowMs = useMemo(() => (item ? requestWindowMs(item) : 0), [item]);
  /**
   * A janela que a frase do topo anuncia. Vem do servidor (`expires_at` menos
   * `created_at`), não de uma constante: dizer "tens 20 minutos" enquanto o
   * contador arranca em 2:00 era o ecrã a contradizer-se à primeira vista.
   */
  const janelaTotalMs = useMemo(() => (item ? requestWindowFromServer(item) : 0), [item]);
  const immediate = isImmediateRequest(item);

  const [now, setNow] = useState(() => Date.now());
  const playAlert = useAlertSound();
  const vibratedRef = useRef(false);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/home');
  }, []);

  /**
   * Sair deste pedido: se houver outro à espera, mostra-o; senão fecha.
   * É o que corre depois de aceitar, de recusar e de o tempo acabar.
   */
  const sair = useCallback(() => {
    if (closingRef.current) return;
    if (seguirParaOProximo()) return;
    close();
  }, [seguirParaOProximo, close]);

  // Som + vibração forte ao abrir (expo-haptics não está instalado neste
  // projeto). O som é o que chega a um técnico com o telemóvel na bancada: a
  // vibração sozinha perde-se em cima de uma mesa ou dentro da carrinha.
  useEffect(() => {
    void playAlert();
    Vibration.vibrate(Platform.OS === 'android' ? [0, 400, 150, 400] : 400);
    return () => Vibration.cancel();
  }, [playAlert]);

  // Aberto por push com a app fria, a lista de pedidos ainda não carregou —
  // fechar logo por `!item` matava o ecrã antes de haver dados. Pede a lista
  // e só desiste quando ela chegou mesmo e o pedido não está lá.
  const requestedRef = useRef(false);
  useEffect(() => {
    if (item || requestedRef.current) return;
    requestedRef.current = true;
    getPendingServices();
  }, [item, getPendingServices]);

  /**
   * O pedido deixou de estar na lista: aceite ou recusado (aqui ou noutro
   * sítio), ou expirado antes de a app abrir.
   *
   * SAI PELA FILA, não fecha. Aceitar e recusar removem o item da lista, e era
   * este efeito -- não o `onAccept`/`onRefuse` -- que corria primeiro e mandava
   * tudo para a Home. O encadeamento para o pedido seguinte existia e nunca
   * chegava a disparar; a fila só se via no selo e morria à primeira decisão.
   *
   * `pendingServicesLoading` começa a true, por isso nunca sai antes de a
   * primeira resposta chegar.
   */
  useEffect(() => {
    if (!item && !pendingServicesLoading) sair();
  }, [item, pendingServicesLoading, sair]);

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

  /**
   * Esgotado o tempo, o ecrã fecha-se sozinho.
   *
   * Até aqui ficava aberto à espera de um toque em "Fechar" — e este ecrã não
   * se deixa sair por gesto nem pelo back de hardware (é de propósito, para a
   * decisão não escapar por engano). O resultado era um técnico preso num ecrã
   * que já não tinha decisão nenhuma para tomar, a tapar-lhe a app inteira.
   *
   * NÃO fecha de imediato: mostra 2 segundos de "O tempo terminou" primeiro.
   * Desaparecer no instante em que o contador chega a zero, com o ecrã a
   * mudar sozinho debaixo dos olhos, deixa-o sem saber se perdeu o pedido ou
   * se carregou nalguma coisa sem querer.
   *
   * O botão "Fechar" FICA: quem já percebeu não tem de esperar os 2 segundos.
   */
  useEffect(() => {
    if (!expired) return;
    const timer = setTimeout(sair, 2000);
    return () => clearTimeout(timer);
  }, [expired, sair]);

  const onAccept = useCallback(async () => {
    if (!item) return;
    const ok = await accept({ scheduleId: item.schedule_id, serviceId: item.service_id });
    if (ok) sair();
  }, [accept, item, sair]);

  const onRefuse = useCallback(async () => {
    if (!item) return;
    const ok = await refuse(item.service_id);
    if (ok) sair();
  }, [refuse, item, sair]);

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
        {/* A fila tem de ser VISÍVEL e ABERTA.
            Visível porque sem isto ele decide este a pensar que é o único, e
            descobre que havia mais quando o seguinte lhe aparece do nada --
            saber que vem outro atrás muda a decisão de recusar um trabalho
            longe. Aberta porque decidir um de cada vez, às cegas, obriga-o a
            dizer que sim ao primeiro sem saber se o segundo era melhor: toca e
            vê-os todos, com os contadores de cada um a correr. */}
        {fila.length > 0 && (
          <TouchableOpacity
            onPress={verTodos}
            activeOpacity={0.8}
            className="flex-row items-center rounded-2xl px-4 py-3.5 mb-4"
            style={{
              backgroundColor: `${Colors.brand}1f`,
              borderWidth: 1.5,
              borderColor: `${Colors.brand}66`,
            }}
            accessibilityRole="button"
            accessibilityLabel={t('schedules.queue_see_all', { defaultValue: 'Ver todos os pedidos' })}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: Colors.brand }}
            >
              <Feather name="layers" size={17} color={Colors.on_brand} />
            </View>
            <View className="flex-1">
              <CustomText color="brand" size="medium" boldness="bold" numberOfLines={1}>
                {t('schedules.queue_count', {
                  count: fila.length,
                  defaultValue_one: 'Mais {{count}} pedido à espera',
                  defaultValue_other: 'Mais {{count}} pedidos à espera',
                })}
              </CustomText>
              <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={1}>
                {t('schedules.queue_see_all_hint', {
                  defaultValue: 'Vê todos antes de decidires',
                })}
              </CustomText>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.brand} />
          </TouchableOpacity>
        )}

        <View className="items-center mb-4">
          <Feather name="bell" size={30} color={Colors.brand} />
          <CustomText color="secondary" boldness="bolder" size="subtitle" classes="mt-1.5 text-center">
            {t('schedules.incoming_request_title', { defaultValue: 'Novo pedido recebido' })}
          </CustomText>
          <CustomText color="muted" size="small" classes="mt-1 text-center">
            {immediate
              ? t('schedules.incoming_request_window_immediate', {
                  defaultValue: 'Tens {{seconds}} segundos para aceitar.',
                  seconds: Math.round(janelaTotalMs / 1000),
                })
              : t('schedules.incoming_request_window_scheduled', {
                  defaultValue: 'Tens {{minutes}} minutos para aceitar.',
                  minutes: Math.max(1, Math.round(janelaTotalMs / 60000)),
                })}
          </CustomText>

          {/* Contagem decrescente grande */}
          <CustomText
            color={expired ? 'danger' : urgent ? 'danger' : 'brand'}
            boldness="bolder"
            size="headline"
            classes="mt-2"
          >
            {countdownLabel}
          </CustomText>
          <View
            className="w-full rounded-full overflow-hidden mt-1.5"
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

        {/* `remainingTime` vai VAZIO de propósito.
            O cartão sabe desenhar a sua própria contagem com barra -- e é o que
            faz na lista de pedidos, onde é a única que existe. Aqui em cima já
            há um contador gigante com barra: os dois juntos eram o mesmo número
            duas vezes, duas barras a esvaziar ao mesmo ritmo, e mais 40 px de
            altura a empurrar o "Recusar" para fora do ecrã em telemóveis
            pequenos. */}
        <ServiceCard
          item={item}
          scheduleFor={item.schedule ? `${item.schedule.scheduled_day}` : null}
          price={priceLabel}
          remainingTime={undefined}
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

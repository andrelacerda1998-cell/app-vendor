import { Colors } from '@/constants/Colors';
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import { useSession } from '@/contexts/SessionContext';
import { CustomText } from "@/components/CustomText";
import CustomerPhotos from "@/components/app/CustomerPhotos";
import { useService } from "@/contexts/ServiceContext";
import IDomParser from "advanced-html-parser";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import CheckMark from "@/assets/icons/check-mark";
import { router, useLocalSearchParams } from "expo-router";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { ServiceStatus } from "@/types/services";
import { useTranslation } from "react-i18next";
import { renderMoney } from "@/utils/money";
import ServiceExtras, { ServiceExtrasActions, type ExtrasSheet } from "@/components/services/ServiceExtras";
import ServicePhotos from "@/components/services/ServicePhotos";
import ServiceCountdown from "@/components/services/ServiceCountdown";
import { Card, ErrorState, SkeletonList } from "@/components/ui";
import { formatEstimatedDuration } from "@/utils/serviceDetails";
import { useNavChooser } from "@/hooks/useNavChooser";
import ServiceRouteMap from "@/components/services/ServiceRouteMap";
import { track, AnalyticsEvent } from "@/utils/analytics";

interface Details{
  includes: string[];
  excludes: string[];
};

const STATUS_RANK: Record<string, number> = {
  [ServiceStatus.ACCEPTED]: 1,
  [ServiceStatus.ARRIVED]: 2,
  [ServiceStatus.FINISHED]: 3,
};

const Stepper = ({ steps, currentRank }: { steps: { label: string; rank: number }[]; currentRank: number }) => (
  <View className="flex-row items-start">
    {steps.map((s, i) => {
      const reached = currentRank >= s.rank;
      const nextReached = i < steps.length - 1 && currentRank >= steps[i + 1].rank;
      // A etapa atual é a última já alcançada.
      const isCurrent = reached && (i === steps.length - 1 || currentRank < steps[i + 1].rank);
      return (
        <React.Fragment key={i}>
          <View className="flex-1 items-center">
            <Ionicons
              name={reached ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={reached ? Colors.success : Colors.muted}
            />
            {/* Duas linhas: "Em execução" e "A caminho" não cabem numa só num
                ecrã estreito, e cortavam para "Em exe…". A etapa atual fica a
                cheio; as restantes recuam, para o olho ir direto ao ponto certo. */}
            <CustomText
              size="extraSmall"
              boldness={isCurrent ? "bold" : reached ? "semiBold" : "regular"}
              color={isCurrent ? "secondary" : reached ? "secondary" : "muted"}
              numberOfLines={2}
              classes="mt-1 text-center"
              style={{ lineHeight: 14, opacity: isCurrent ? 1 : reached ? 0.75 : 0.6 }}
            >
              {s.label}
            </CustomText>
          </View>
          {i < steps.length - 1 && (
            // Traço de largura fixa: com `flex-1` os três conectores comiam
            // metade da barra e as etiquetas ficavam sem espaço para as palavras.
            <View
              className="h-0.5"
              style={{ width: 22, marginTop: 10, backgroundColor: nextReached ? Colors.success : Colors.line }}
            />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

const Action = ({ Icon, label, onPress, disabled, badge }: {Icon: React.FC, label: string, onPress: () => void, disabled: boolean, badge?: number}) => {
  return (
    <CustomTouchableOpacity classes="items-center" onPress={onPress} disabled={disabled}>
      <View
        className="rounded-xl h-12 w-12 items-center justify-center relative border"
        style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
      >
        <Icon />
        {badge !== undefined && badge > 0 && (
          <View
            className="rounded-full h-5 w-5 items-center justify-center absolute -top-2 -right-2"
            style={{ backgroundColor: Colors.danger }}
          >
            <CustomText size="extraSmall" boldness="bold" color="secondary">
              {badge > 9 ? '9+' : badge}
            </CustomText>
          </View>
        )}
      </View>
      <CustomText size="extraSmall" boldness="semiBold" color="muted" classes="text-center mt-1" numberOfLines={1}>
        {label}
      </CustomText>
    </CustomTouchableOpacity>
  )
}

const Status = () => {
  const { t } = useTranslation();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { api } = useApi();
  const { vendorData } = useSession();
  const { openService, setOpenService, unreadMessages, clearUnreadMessages } = useService();
  const { openDialog } = useDialog();
  const [loadingFinishService, setLoadingFinishService] = useState(false);
  const [busyCta, setBusyCta] = useState(false);
  // Os botões de extras vivem no rodapé, mas a lista está no conteúdo:
  // o ecrã guarda qual a folha aberta para os dois partilharem estado.
  const [extrasSheet, setExtrasSheet] = useState<ExtrasSheet>(null);
  const [ servicesDetail, setServicesDetail] = useState<Details>({ includes: [], excludes: []})
  /**
   * O ecrã nasceu para o serviço EM CURSO (`openService`, do ServiceContext).
   * A Agenda passou a abri-lo também para serviços apenas AGENDADOS, que não
   * são o serviço aberto — nesse caso `openService` está vazio (ou é outro) e
   * o ecrã aparecia em branco. Buscamos então o serviço do URL:
   * `GET /vendor/services/{id}` devolve o mesmo `formatDataForVendor()`.
   */
  const [routeService, setRouteService] = useState<any>(null);
  const [loadingRouteService, setLoadingRouteService] = useState(false);

  const liveService: any =
    openService && String(openService.id) === String(serviceId) ? openService : null;

  /**
   * Os dois lados completam-se, por isso juntam-se em vez de um substituir o
   * outro: `openService` é o que os sockets mantêm a par (estado, a caminho),
   * mas vem de um payload magro — sem agendamento, morada nem valor. Escolher
   * só um deles fazia a hora e o "Vais receber" desaparecerem assim que o
   * socket atualizava. Só os campos preenchidos do "vivo" é que se sobrepõem,
   * para um `null` do payload magro não apagar o detalhe já carregado.
   */
  const svc: any = useMemo(() => {
    if (!liveService && !routeService) return null;
    const merged: any = { ...(routeService ?? {}) };
    Object.entries(liveService ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) merged[key] = value;
    });
    return merged;
  }, [liveService, routeService]);

  const serviceTypeId = svc?.service_type?.id;

  // Vai sempre buscar o detalhe completo deste serviço (não depende de `svc`
  // estar preenchido: o payload magro do contexto já o preenchia e impedia o
  // pedido, deixando o ecrã sem morada, hora nem valor).
  useEffect(() => {
    if (!serviceId) return;
    if (routeService && String(routeService.id) === String(serviceId)) return;
    let cancelled = false;
    setLoadingRouteService(true);
    api
      .get(API_ROUTES.GET_SERVICE_DETAILS(String(serviceId)))
      .then(({ data }) => {
        if (!cancelled) setRouteService(data?.data?.service ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingRouteService(false);
      });
    return () => { cancelled = true; };
  }, [serviceId, routeService]);

  const desc = (text: string) => {
    if (text[0] !== "<") return text;
    try {
      const parsed = IDomParser.parse(text);
      return parsed.documentElement?.textContent;
    } catch (error) {
      return text;
    }
  };

  const finishService = async () => {
    setLoadingFinishService(true);
    api.post(API_ROUTES.POST_FINISH_SERVICE(`${svc?.id}`))
      .then(({ data }) => {
        if (data.data.service) {
          setRouteService(data.data.service);
          setOpenService(data.data.service);
        }
        track(AnalyticsEvent.SERVICE_COMPLETED, { service_id: Number(svc?.id) });
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t('services.service.finish.title'),
          subtitle: t('services.service.finish.subtitle'),
          closeAfterMSeconds: 5000,
          closeOnClickOutside: true,
          onClose: () => {
            router.dismissAll();
          }
        })
      })
      .catch((error) => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.service_finish.title'),
          subtitle: error?.response?.data?.metadata?.message || error?.response?.data?.message || t('errors.service_finish.subtitle'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        })
      })
      .finally(() => {
        setLoadingFinishService(false);
      })
  }

  const handleFinishService = () => {
    openDialog({
      title: t('services.service.finish.confirmation.title'),
      subtitle: t('services.service.finish.confirmation.subtitle'),
      successButtonText: t('services.service.finish.confirmation.confirm'),
      cancelButtonText: t('services.service.finish.confirmation.cancel'),
      onSuccess: () => finishService(),
    })
  };


  const isObj = (item: any) => {
    if (typeof item === "object" && !Array.isArray(item) && item !== null) {
      return true;
    } else return false;
  };


  const getOperationAreas = async (typeId?: number): Promise<void> => {
    api
      .post(API_ROUTES.POST_SEARCH_OPERATION_AREAS, {})
      .then((response) => {
        const { data } = response?.data || {};

        if (data?.services_types && Array.isArray(data?.services_types)) {
          let filtered: any = data?.services_types?.filter(
            (elem: any) => elem?.id === typeId
            // (elem: any) => elem?.id === 85 //mock for test purposes
          );

          if (Array.isArray(filtered) && filtered.length > 0) {

            let included: string[] = [];
            let excluded: string[] = [];

            if (isObj(filtered[0]) &&
                filtered[0]?.hasOwnProperty("excludes") &&
                filtered[0]?.hasOwnProperty("includes"))
            {
              if(Array.isArray(filtered[0].includes)){
                filtered[0].includes.map((inc: any )=> {
                  if(typeof inc === 'string'){
                    included.push(inc);
                  }
                })
              }
              if(Array.isArray(filtered[0].excludes)){

                filtered[0].excludes.map((exc: any )=> {
                  if(typeof exc === 'string'){
                    excluded.push(exc);
                  }
                })
              }
            }


            setServicesDetail({...servicesDetail, includes: included, excludes: excluded});

          }
        }
      })
      .catch((error) => {
        if (error?.response?.status !== 401) {
           openDialog({
             icon: <XIcon color={Colors.secondary} />,
             title: t("errors.service_details.title"),
             subtitle: t("errors.service_details.subtitle"),
             closeAfterMSeconds: 2000,
             closeOnClickOutside: true,
           });
        }
      })
      .finally(() => {});
  };




  // Só depois de sabermos o tipo de serviço: num agendamento aberto pela Agenda
  // o `svc` chega depois do primeiro render, e com `[]` a lista de
  // incluído/não incluído ficava sempre vazia.
  useEffect(() => {
    if (!serviceTypeId) return;
    getOperationAreas(serviceTypeId);
  }, [serviceTypeId])

  const onTheWay = !!svc?.on_the_way_at;
  const status = svc?.status;

  /** Estou a caminho → Cheguei → Concluir */
  const handlePrimaryAction = async () => {
    if (status === ServiceStatus.ARRIVED) {
      handleFinishService();
      return;
    }
    setBusyCta(true);
    try {
      // Um serviço ainda AGENDADO tem de passar primeiro por go-to-location
      // (Scheduled → Accepted, e é o que avisa o cliente); só depois é que
      // /on-the-way é aceite pelo backend — de outra forma devolvia 422.
      if (status === ServiceStatus.SCHEDULED) {
        const accepted = await api.post(API_ROUTES.VENDOR_SCHEDULE_GO_TO_LOCATION(Number(svc?.id)));
        if (accepted?.data?.data?.service) {
          setRouteService(accepted.data.data.service);
          setOpenService(accepted.data.data.service);
        }
      }
      const url = onTheWay
        ? API_ROUTES.POST_ARRIVED_AT_DESTINATION_SERVICE(`${svc?.id}`)
        : API_ROUTES.VENDOR_SERVICE_ON_THE_WAY(svc?.id);
      const { data } = await api.post(url);
      if (data?.data?.service) {
        setRouteService(data.data.service);
        setOpenService(data.data.service);
      }
      track(onTheWay ? AnalyticsEvent.SERVICE_STARTED : AnalyticsEvent.TRAVEL_STARTED, {
        service_id: Number(svc?.id),
      });
      // Ao marcar "estou a caminho" o passo seguinte é sempre conduzir até lá:
      // abrir logo a escolha de navegação poupa um toque no momento em que
      // o técnico já está a arrancar.
      if (!onTheWay) startNavigation();
    } catch (error: any) {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.service_status.title'),
        subtitle: error?.response?.data?.metadata?.message || t('errors.service_status.subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
    } finally {
      setBusyCta(false);
    }
  };

  // 4 passos: Aceite → A caminho → Em execução → Concluído
  const currentRank =
    status === ServiceStatus.FINISHED ? 4
      : status === ServiceStatus.ARRIVED ? 3
      : onTheWay ? 2
      : 1;

  const steps = [
    { label: t("services.service.status.steps.accepted"), rank: 1 },
    { label: t("services.service.status.steps.on_the_way"), rank: 2 },
    { label: t("services.service.status.steps.in_progress"), rank: 3 },
    { label: t("services.service.status.steps.completed"), rank: 4 },
  ];

  // "Vais receber" é o que FICA para o técnico (amount_for_vendor, já sem a
  // comissão da Piquet) — não o amount, que é o total pago pelo cliente. Usar
  // amount inflacionava o valor; sem fallback para amount para não voltar a
  // mostrar um número maior do que o técnico realmente recebe.
  const earn = renderMoney(svc?.amount_for_vendor ?? null);
  // "~45 min" / "~1h30" — o helper já trata da unidade; a chave i18n antiga
  // imprimia só o número ("Duração estimada: 45"), sem dizer de quê.
  const durationLabel = formatEstimatedDuration(svc?.service_type?.time);
  const category = svc?.service_type?.operation_area?.name;

  // Dia + hora do serviço. A hora vem do agendamento (`schedule`), porque
  // `scheduled_at` traz só o dia — usá-lo sozinho dava sempre "00:00".
  const whenLabel = (() => {
    const iso = svc?.schedule?.scheduled_day || svc?.scheduled_at || svc?.created_at;
    if (!iso) return null;
    const d = new Date(String(iso).split('T')[0]);
    if (isNaN(d.getTime())) return null;

    const start = String(svc?.schedule?.scheduled_time?.start ?? '').slice(0, 5);
    const time = start || new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return `${t('schedules.date_label.today')}, ${time}`;
    if (diff === 1) return `${t('schedules.date_label.tomorrow')}, ${time}`;
    return `${d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}, ${time}`;
  })();


  // Morada do cliente: rua + número (e complemento, se houver). O backend
  // devolve-a em `address` via formatVendorAddress().
  const addressLine = [
    [svc?.address?.street_name, svc?.address?.street_number].filter(Boolean).join(', ')
      || svc?.address?.city
      || svc?.address?.name,
    svc?.address?.additional_info,
  ]
    .filter(Boolean)
    .join(' · ');


  /**
   * Navegação turn-by-turn na app de mapas do telemóvel (só Apple/Google/Waze,
   * via useNavChooser). Antes só havia o mapa dentro da app, que não dá
   * indicações — o técnico tinha de copiar a morada à mão.
   */
  const chooseNavApp = useNavChooser();
  const startNavigation = () =>
    chooseNavApp(svc?.address, svc?.address?.name, (app) =>
      track(AnalyticsEvent.NAVIGATION_OPENED, { app }),
    );

  const goToChat = () => {
    track(AnalyticsEvent.CHAT_OPENED, { service_id: Number(svc?.id) });
    clearUnreadMessages();
    // `navigate` e não `dismissTo`: aberto a partir da Agenda o chat ainda não
    // está na pilha, e `dismissTo` só sabe voltar a ecrãs que já lá estejam.
    router.navigate(`/(app)/(services)/(open)/(chat)/service/${svc?.id}`);
  };

  // Sem serviço não há nada de verdadeiro para mostrar: mais vale dizê-lo do
  // que desenhar os cartões todos vazios.
  if (!svc) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <BackHeader
          backButtonColor="secondary"
          middleItem={() => (
            <CustomText color="secondary" boldness="bold" numberOfLines={1}>
              {t('services.service.status.header')}
            </CustomText>
          )}
          otherClasses="px-5 py-4"
        />
        <View className="flex-1 px-5 pt-2">
          {loadingRouteService ? (
            <SkeletonList rows={3} />
          ) : (
            <ErrorState
              icon="alert-circle"
              title={t('errors.service_details.title')}
              subtitle={t('errors.service_details.subtitle')}
              onRetry={() => router.back()}
              retryLabel={t('general.back')}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('services.service.status.header')}
          </CustomText>
        )}
        rigthItem={
          (status === ServiceStatus.ACCEPTED || status === ServiceStatus.ARRIVED)
            ? () => (
              <TouchableOpacity onPress={() => router.push(`/(app)/(services)/(open)/cancel/${svc?.id}`)}>
                <Feather name="x" size={24} color={Colors.danger} />
              </TouchableOpacity>
            )
            : undefined
        }
        otherClasses="px-5 py-4"
      />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Cabeçalho: serviço + valor à direita, meta por baixo.
            O valor vive aqui (e já não a meio do ecrã, num cartão à parte):
            equilibra o cabeçalho, que antes tinha tudo encostado à esquerda, e
            junta num só bloco o resumo do serviço — o quê, quando e quanto. */}
        <Card>
          <View className="flex-row items-start">
            <View className="flex-1 pr-3">
              <CustomText color="secondary" boldness="bolder" size="medium" numberOfLines={2}>
                {svc?.service_type?.name}
              </CustomText>
              {!!category && (
                <CustomText color="muted" size="small" numberOfLines={1} classes="mt-0.5">{category}</CustomText>
              )}
            </View>
            {earn ? (
              <View className="items-end">
                <CustomText color="muted" size="extraSmall">
                  {t('services.service.status.value_to_receive')}
                </CustomText>
                <CustomText color="brand" boldness="bolder" size="large" classes="mt-0.5">
                  {earn}
                </CustomText>
              </View>
            ) : null}
          </View>


          {/* A meta (quando/duração/imediato) só decide algo ANTES de arrancar.
              Com o serviço a decorrer, o cabeçalho fica só com o título e o
              valor — o resto é ruído nesse momento. */}
          {status !== ServiceStatus.ARRIVED && (
            <>
              <View className="h-px my-4" style={{ backgroundColor: Colors.line }} />

              <View className="flex-row items-center flex-wrap" style={{ rowGap: 8 }}>
                {!!whenLabel && (
                  <View className="flex-row items-center mr-3">
                    <Feather name="calendar" size={15} color={Colors.muted} />
                    <CustomText color="secondary" size="small" classes="ml-2">{whenLabel}</CustomText>
                  </View>
                )}
                {!!durationLabel && (
                  <View className="flex-row items-center mr-3">
                    <Feather name="clock" size={15} color={Colors.muted} />
                    <CustomText color="secondary" size="small" classes="ml-2">
                      {t('services.service.status.estimated_duration', { value: durationLabel })}
                    </CustomText>
                  </View>
                )}
              </View>
              {svc?.is_immediate && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="flash" size={15} color={Colors.danger} />
                  <CustomText size="small" color="danger" classes="ml-2.5">
                    {t('services.service.status.immediate')}
                  </CustomText>
                </View>
              )}
            </>
          )}
        </Card>

        {/* Com o serviço a decorrer, o tempo restante vem ANTES do stepper: é a
            pergunta que o técnico tem naquele momento; o estado ele já sabe. */}
        {status === ServiceStatus.ARRIVED && (
          <ServiceCountdown
            startedAt={svc?.arrived_at}
            estimatedMinutes={svc?.service_type?.time}
            // Mesma folha do botão do rodapé — um só caminho para a ação.
            onRequestExtraTime={() => setExtrasSheet('time')}
          />
        )}

        {/* Em execução, o trabalho-agora vem primeiro: fotos (o "antes" tira-se
            ao chegar) e extras logo a seguir ao cronómetro. */}
        {status === ServiceStatus.ARRIVED && (
          <>
            <ServicePhotos serviceId={svc?.id} enabled={svc?.status === ServiceStatus.ARRIVED} />
            <ServiceExtras
              serviceId={svc?.id}
              enabled={svc?.status === ServiceStatus.ARRIVED}
              sheet={extrasSheet}
              onSheetChange={setExtrasSheet}
            />
          </>
        )}

        {/* Stepper de estado — escondido em execução: o cronómetro a correr e o
            botão "Concluir" já dizem em que ponto está; o stepper só mostrava o
            passado e comia espaço. */}
        {status !== ServiceStatus.ARRIVED && (
          <Card className="mt-3">
            <Stepper steps={steps} currentRank={currentRank} />
          </Card>
        )}

        {/* Cliente + mapa + ações */}
        <Card className="mt-3">
          <CustomText color="muted" size="extraSmall" boldness="bold">
            {t('schedules.customer', { defaultValue: 'Cliente' })}
          </CustomText>
          <CustomText color="secondary" boldness="bolder" size="large" numberOfLines={1} classes="mt-0.5">
            {svc?.customer?.name}
          </CustomText>
          {/* Só com morada a sério — o pin sozinho não dizia nada. */}
          {!!addressLine && (
            <View className="flex-row items-start mt-1">
              <Feather name="map-pin" size={14} color={Colors.muted} style={{ marginTop: 2 }} />
              <CustomText color="muted" size="small" numberOfLines={2} classes="ml-1.5 flex-1">
                {addressLine}
              </CustomText>
            </View>
          )}

          {/* Mapa do caminho até ao cliente; ao toque abre o Waze/Maps.
              Some quando o serviço já está a decorrer (ARRIVED): a essa altura
              o técnico já está no local, o caminho deixou de interessar. */}
          {status !== ServiceStatus.ARRIVED && (
            <ServiceRouteMap
              serviceId={svc?.id}
              destination={svc?.address}
              origin={vendorData?.current_location ?? vendorData?.location}
              onPress={startNavigation}
            />
          )}

          {/* Observações do cliente. Vinham do detalhe do agendamento, que
              deixou de existir — sem isto perdia-se o que o cliente escreveu. */}
          {!!svc?.customer_notes && (
            <View className="mt-3">
              <CustomText color="muted" size="extraSmall" boldness="bold">
                {t('schedules.customer_notes')}
              </CustomText>
              <CustomText color="secondary" size="small" classes="mt-1">
                {svc.customer_notes}
              </CustomText>
            </View>
          )}

          {/* Também durante a execução, e não só ao aceitar: já no local, a foto
              do que o cliente mostrou é a referência para confirmar que se está
              a olhar para o problema certo. */}
          <CustomerPhotos photos={svc?.customer_photos} />

          <View className="flex-row mt-3" style={{ gap: 10 }}>
            {/* Navegar: abre o Maps/Waze do telemóvel com o destino já preenchido. */}
            <TouchableOpacity
              onPress={startNavigation}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: 'rgba(250,187,91,0.16)', borderWidth: 1, borderColor: 'rgba(250,187,91,0.45)' }}
            >
              <Feather name="navigation" size={18} color={Colors.brand} />
              <CustomText size="small" color="brand" boldness="bold" classes="mt-1">
                {t('services.service.status.open_map')}
              </CustomText>
            </TouchableOpacity>
            {/* Sem opção de ligar: o contacto com o cliente passa só pelo chat,
                que deixa rasto e evita expor/usar o número de telefone. */}
            <TouchableOpacity
              onPress={goToChat}
              className="flex-1 items-center rounded-xl py-3 border"
              style={{ borderColor: Colors.line }}
            >

              <View>
                <Feather name="message-square" size={18} color={Colors.secondary} />
                {unreadMessages > 0 && (
                  <View
                    className="absolute rounded-full items-center justify-center"
                    style={{ width: 16, height: 16, top: -6, right: -8, backgroundColor: Colors.danger }}
                  >
                    <CustomText size="extraSmall" boldness="bold" color="secondary">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </CustomText>
                  </View>
                )}
              </View>
              <CustomText size="small" color="secondary" boldness="semiBold" classes="mt-1">
                {t('services.service.status.chat')}
              </CustomText>
            </TouchableOpacity>
          </View>

        </Card>

        {/* O valor a receber subiu para o cabeçalho — ver comentário lá. */}

        {/* Incluído / Não incluído — só quando o catálogo tem mesmo conteúdo.
            Com ambos vazios, o cartão dizia "Sem informação" duas vezes:
            um bloco inteiro a comunicar ausência de conteúdo. */}
        {((servicesDetail?.includes?.length ?? 0) > 0 || (servicesDetail?.excludes?.length ?? 0) > 0) && (
        <View className="bg-card border rounded-2xl p-4 mt-3" style={{ borderColor: Colors.line }}>
          <CustomText color="muted" boldness="bold" size="extraSmall">{t('services.includes')}</CustomText>
          <View className="mt-2">
            {servicesDetail?.includes?.length > 0 ? (
              servicesDetail.includes.map((item: any, i: number) => (
                <View className="flex-row items-start mb-1.5" key={i}>
                  <Ionicons name="checkmark-circle" size={17} color={Colors.success} style={{ marginTop: 1 }} />
                  <CustomText color="secondary" size="small" classes="ml-2 flex-1">
                    {typeof item === 'string' ? item : t('services.no_info')}
                  </CustomText>
                </View>
              ))
            ) : (
              <CustomText color="muted" size="small">{t('services.no_info')}</CustomText>
            )}
          </View>

          <View className="h-px my-3" style={{ backgroundColor: Colors.line }} />

          <CustomText color="muted" boldness="bold" size="extraSmall">{t('services.excludes')}</CustomText>
          <View className="mt-2">
            {servicesDetail?.excludes?.length > 0 ? (
              servicesDetail.excludes.map((item: any, i: number) => (
                <View className="flex-row items-start mb-1.5" key={i}>
                  <Ionicons name="close-circle" size={17} color={Colors.muted} style={{ marginTop: 1 }} />
                  <CustomText color="secondary" size="small" classes="ml-2 flex-1">
                    {typeof item === 'string' ? item : t('services.no_info')}
                  </CustomText>
                </View>
              ))
            ) : (
              <CustomText color="muted" size="small">{t('services.no_info')}</CustomText>
            )}
          </View>
        </View>
        )}

      </ScrollView>

      {/* CTA principal — muda com o estado do serviço */}
      {status !== ServiceStatus.FINISHED && (
        <View className="px-5 pt-3 pb-5" style={{ backgroundColor: Colors.bg }}>
          {/* Tempo extra e peças mesmo por cima do CTA: com o serviço a decorrer,
              é aqui que a mão do técnico está, e sem ter de percorrer o ecrã. */}
          {status === ServiceStatus.ARRIVED && (
            <ServiceExtrasActions
              disabled={busyCta || loadingFinishService}
              onAddTime={() => setExtrasSheet('time')}
              onAddPart={() => setExtrasSheet('part')}
            />
          )}
          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={
              busyCta
                ? t('general.loading')
                : status === ServiceStatus.ARRIVED
                ? t('services.service.status.finish_service')
                : onTheWay
                ? t('services.service.status.start_service')
                : t('services.service.status.on_my_way')
            }
            textSize="medium"
            textColor="on_brand"
            textBoldness="bold"
            onPress={handlePrimaryAction}
            disabled={busyCta || loadingFinishService}
          />
        </View>
      )}
    </SafeAreaView>
  )
}

export default Status;

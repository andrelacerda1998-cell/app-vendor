import { Colors } from '@/constants/Colors';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import BackHeader from '@/components/app/BackHeader';
import { useSession } from '@/contexts/SessionContext';
import { CustomText } from "@/components/CustomText";
import { useService } from "@/contexts/ServiceContext";
import IDomParser from "advanced-html-parser";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import CheckMark from "@/assets/icons/check-mark";
import { router } from "expo-router";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useDialog } from "@/contexts/DialogContext";
import XIcon from "@/assets/icons/x";
import { ServiceStatus } from "@/types/services";
import { useTranslation } from "react-i18next";
import { renderMoney } from "@/utils/money";
import ServiceExtras, { ServiceExtrasActions, type ExtrasSheet } from "@/components/services/ServiceExtras";
import ServicePhotos from "@/components/services/ServicePhotos";
import { Card, HeroCard, IconTile } from "@/components/ui";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { callPhone, navApps, openNavigation } from "@/utils/fieldActions";
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
  const { showActionSheetWithOptions } = useActionSheet();
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
    api.post(API_ROUTES.POST_FINISH_SERVICE(`${openService?.id}`))
      .then(({ data }) => {
        if (data.data.service) setOpenService(data.data.service);
        track(AnalyticsEvent.SERVICE_COMPLETED, { service_id: Number(openService?.id) });
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


  const getOperationAreas = async (): Promise<void> => {
    api
      .post(API_ROUTES.POST_SEARCH_OPERATION_AREAS, {})
      .then((response) => {
        const { data } = response?.data || {};

        if (data?.services_types && Array.isArray(data?.services_types)) {
          let filtered: any = data?.services_types?.filter(
            (elem: any) => elem?.id === openService?.service_type?.id
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




  useEffect(() => {
    const handleOperationAreas = async () => {
      // setLoadingOperationAreas(true);
      await getOperationAreas();
      // setLoadingOperationAreas(false);
    }
    handleOperationAreas();
  }, [])

  const svc: any = openService;
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
      const url = onTheWay
        ? API_ROUTES.POST_ARRIVED_AT_DESTINATION_SERVICE(`${svc?.id}`)
        : API_ROUTES.VENDOR_SERVICE_ON_THE_WAY(svc?.id);
      const { data } = await api.post(url);
      if (data?.data?.service) setOpenService(data.data.service);
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

  const earn = renderMoney(svc?.amount ?? svc?.amount_for_vendor ?? null);
  const duration = svc?.service_type?.time;
  const category = svc?.service_type?.operation_area?.name;

  const statusPill =
    status === ServiceStatus.FINISHED
      ? { label: t('services.service.status.steps.completed'), color: Colors.success }
      : status === ServiceStatus.ARRIVED
      ? { label: t('services.service.status.steps.in_progress'), color: Colors.destination }
      : onTheWay
      ? { label: t('services.service.status.steps.on_the_way'), color: Colors.destination }
      : { label: t('services.service.status.steps.accepted'), color: Colors.success };

  const whenLabel = (() => {
    const iso = svc?.scheduled_at || svc?.created_at;
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    if (day.getTime() === today.getTime()) return `${t('schedules.date_label.today')}, ${time}`;
    return `${d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}, ${time}`;
  })();

  const goToMap = () => router.push(`/(app)/(services)/(open)/progress/${svc?.id}`);

  /**
   * Navegação turn-by-turn na app de mapas do telemóvel. Antes só havia o mapa
   * dentro da app, que não dá indicações — o técnico tinha de copiar a morada à mão.
   */
  const startNavigation = () => {
    const apps = navApps();
    const labels = apps.map((a) => t(`services.service.status.nav_apps.${a}`));
    showActionSheetWithOptions(
      {
        options: [...labels, t('general.cancel')],
        cancelButtonIndex: labels.length,
        title: t('services.service.status.navigate_with'),
      },
      (index?: number) => {
        if (index == null || index >= apps.length) return;
        track(AnalyticsEvent.NAVIGATION_OPENED, { app: apps[index] });
        openNavigation(apps[index], svc?.address, svc?.address?.name);
      },
    );
  };

  // `phone_number` é o nome real da coluna; `phone` fica como salvaguarda
  // caso algum endpoint antigo ainda devolva a chave antiga.
  const customerPhone = (svc?.customer as any)?.phone_number ?? (svc?.customer as any)?.phone;

  const goToChat = () => {
    track(AnalyticsEvent.CHAT_OPENED, { service_id: Number(svc?.id) });
    clearUnreadMessages();
    router.dismissTo(`/(app)/(services)/(open)/(chat)/service/${svc?.id}`);
  };

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
        {/* Cabeçalho: serviço + categoria + estado + meta */}
        <Card>
          <View className="flex-row items-center">
            <IconTile size={52}>
              <MaterialCommunityIcons name="pipe-wrench" size={24} color={Colors.brand} />
            </IconTile>
            <View className="flex-1 ml-3">
              <CustomText color="secondary" boldness="bolder" size="medium" numberOfLines={2}>
                {svc?.service_type?.name}
              </CustomText>
              {!!category && (
                <CustomText color="muted" size="small" numberOfLines={1}>{category}</CustomText>
              )}
            </View>
            <View className="rounded-full px-3 py-1.5 ml-2" style={{ backgroundColor: `${statusPill.color}22` }}>
              <CustomText size="extraSmall" boldness="bold" color="secondary" style={{ color: statusPill.color }}>
                {statusPill.label}
              </CustomText>
            </View>
          </View>

          <View className="h-px my-4" style={{ backgroundColor: Colors.line }} />

          {!!whenLabel && (
            <View className="flex-row items-center mb-2">
              <Feather name="calendar" size={15} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="ml-2.5">{whenLabel}</CustomText>
            </View>
          )}
          {!!duration && (
            <View className="flex-row items-center mb-2">
              <Feather name="clock" size={15} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="ml-2.5">
                {t('services.service.status.estimated_duration', { value: duration })}
              </CustomText>
            </View>
          )}
          {svc?.is_immediate && (
            <View className="flex-row items-center">
              <Ionicons name="flash" size={15} color={Colors.danger} />
              <CustomText size="small" color="danger" classes="ml-2.5">
                {t('services.service.status.immediate')}
              </CustomText>
            </View>
          )}
        </Card>

        {/* Stepper de estado */}
        <Card className="mt-3">
          <Stepper steps={steps} currentRank={currentRank} />
        </Card>

        {/* Cliente + mapa + ações */}
        <Card className="mt-3">
          <CustomText color="muted" size="extraSmall" boldness="bold">
            {t('schedules.customer', { defaultValue: 'Cliente' })}
          </CustomText>
          <CustomText color="secondary" boldness="bolder" size="large" numberOfLines={1} classes="mt-0.5">
            {svc?.customer?.name}
          </CustomText>
          <View className="flex-row items-start mt-1">
            <Feather name="map-pin" size={14} color={Colors.muted} style={{ marginTop: 2 }} />
            <CustomText color="muted" size="small" numberOfLines={2} classes="ml-1.5 flex-1">
              {svc?.address?.name}
              {svc?.address?.additional_info ? ` · ${svc?.address?.additional_info}` : ''}
            </CustomText>
          </View>

          {/* Pré-visualização do mapa */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={goToMap}
            className="rounded-xl overflow-hidden mt-3 justify-center items-center"
            style={{ height: 130, backgroundColor: Colors.card_high }}
          >
            <View className="items-center">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 44, height: 44, backgroundColor: 'rgba(250,187,91,0.22)' }}
              >
                <Ionicons name="location" size={22} color={Colors.brand} />
              </View>
            </View>
            <View
              className="absolute rounded-full flex-row items-center px-3 py-1.5"
              style={{ right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              <Feather name="navigation" size={12} color={Colors.brand} />
              <CustomText size="extraSmall" color="secondary" boldness="semiBold" classes="ml-1.5">
                {t('services.service.status.open_map')}
              </CustomText>
            </View>
          </TouchableOpacity>

          <View className="flex-row mt-3" style={{ gap: 10 }}>
            {/* Navegar: abre o Maps/Waze do telemóvel com o destino já preenchido. */}
            <TouchableOpacity
              onPress={startNavigation}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: 'rgba(250,187,91,0.16)', borderWidth: 1, borderColor: 'rgba(250,187,91,0.45)' }}
            >
              <Feather name="navigation" size={18} color={Colors.brand} />
              <CustomText size="small" color="brand" boldness="bold" classes="mt-1">
                {t('services.service.status.navigate')}
              </CustomText>
            </TouchableOpacity>
            {/* Ligar só faz sentido a caminho: com o serviço já a decorrer o
                técnico está com o cliente à frente. */}
            {!!customerPhone && status !== ServiceStatus.ARRIVED && status !== ServiceStatus.FINISHED && (
              <TouchableOpacity
                onPress={() => { track(AnalyticsEvent.CUSTOMER_CALLED, { service_id: Number(svc?.id) }); callPhone(customerPhone); }}
                className="flex-1 items-center rounded-xl py-3 border"
                style={{ borderColor: Colors.line }}
              >
                <Feather name="phone" size={18} color={Colors.secondary} />
                <CustomText size="small" color="secondary" boldness="semiBold" classes="mt-1">
                  {t('services.service.status.call')}
                </CustomText>
              </TouchableOpacity>
            )}
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

        {/* Valor a receber */}
        {earn ? (
          <HeroCard className="flex-row items-center justify-between" style={{ marginTop: 12 }}>
            <CustomText color="secondary" boldness="semiBold" size="medium">
              {t('services.service.status.value_to_receive')}
            </CustomText>
            <CustomText color="secondary" boldness="bolder" size="subtitle">
              {earn}
            </CustomText>
          </HeroCard>
        ) : null}

        {/* Incluído / Não incluído */}
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
        {/* Fotos e extras só fazem sentido com o serviço a decorrer: antes de
            chegar ao local não há nada para fotografar nem para acrescentar. */}
        {status === ServiceStatus.ARRIVED && (
          <>
        <ServicePhotos
          serviceId={openService?.id}
          enabled={openService?.status === ServiceStatus.ARRIVED}
        />

        <ServiceExtras
          serviceId={openService?.id}
          enabled={openService?.status === ServiceStatus.ARRIVED}
          sheet={extrasSheet}
          onSheetChange={setExtrasSheet}
        />

          </>
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

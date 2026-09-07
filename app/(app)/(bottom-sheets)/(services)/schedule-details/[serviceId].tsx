import React, { useMemo } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Feather } from "@expo/vector-icons";

import { Colors } from "@/constants/Colors";
import ArrowIcon from "@/assets/icons/arrow";
import TouchOpacity from "@/components/TouchOpacity";
import { CustomText } from "@/components/CustomText";
import { Card, EmptyState, IconTile, StatusPill } from "@/components/ui";
import CustomerPhotos from "@/components/app/CustomerPhotos";
import { useSchedule } from "@/contexts/ScheduleContext";
import { renderMoney } from "@/utils/money";
import {
  formatAddressExtra,
  formatCustomerNotes,
  formatEstimatedDuration,
  formatFullAddress,
  recurrenceLabelKey,
} from "@/utils/serviceDetails";
import { ServiceRequestedInterface } from "@/types/services";

/**
 * Detalhes de um serviço da agenda.
 *
 * Este ecrã existe para a pergunta que o técnico faz antes de sair de casa:
 * "o que é que eu vou lá fazer, ao certo?". O cartão da agenda responde ao
 * QUANDO e ao ONDE; aqui está o resto — o que ficou combinado fazer, o que
 * NÃO ficou (é daí que vêm as discussões à porta do cliente), o que o cliente
 * escreveu e as fotos que mandou.
 *
 * Os dados vêm do que a agenda já trouxe (ScheduleContext), não de um pedido
 * novo: abrir os detalhes de um serviço que já está no ecrã não deve depender
 * de haver rede naquele momento.
 */

/** Linha "etiqueta / valor". Sem valor, não se desenha. */
const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;

  return (
    <View className="flex-row items-start mt-3">
      <Feather name={icon} size={16} color={Colors.muted} style={{ marginTop: 3 }} />
      <View className="flex-1 ml-3">
        <CustomText color="muted" size="extraSmall" boldness="bold">
          {label.toUpperCase()}
        </CustomText>
        <CustomText color="secondary" size="small" classes="mt-0.5">
          {value}
        </CustomText>
      </View>
    </View>
  );
};

/**
 * Lista do que inclui / não inclui.
 *
 * O sinal (✓ verde, ✗ vermelho) é o que se lê de relance; o texto vem do
 * backoffice. Se a lista vier vazia, dizemos isso em vez de deixar um espaço
 * em branco — o técnico tem de saber a diferença entre "não inclui nada" e
 * "ninguém preencheu isto".
 */
const ScopeList = ({
  title,
  items,
  positive,
}: {
  title: string;
  items?: string[] | null;
  positive: boolean;
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <View className="mt-4">
      <CustomText color="muted" size="extraSmall" boldness="bold">
        {title.toUpperCase()}
      </CustomText>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} className="flex-row items-start mt-2">
          <Feather
            name={positive ? "check" : "x"}
            size={15}
            color={positive ? Colors.success : Colors.danger}
            style={{ marginTop: 2 }}
          />
          <CustomText color="secondary" size="small" classes="ml-2 flex-1">
            {item}
          </CustomText>
        </View>
      ))}
    </View>
  );
};

const ScheduleDetailsBottomSheet = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { scheduledServicesData } = useSchedule();

  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;

  const item = useMemo<ServiceRequestedInterface | null>(() => {
    if (!serviceId) return null;
    return (
      scheduledServicesData.find((service) => String(service.service_id) === String(serviceId)) ?? null
    );
  }, [scheduledServicesData, serviceId]);

  const header = (
    <View className="flex-row items-center justify-between mb-6">
      <TouchOpacity onPress={() => router.back()} otherClasses="h-10 w-10" itemsCenter>
        <ArrowIcon color={Colors.secondary} position="left" size="40%" />
      </TouchOpacity>
      <CustomText color="secondary" boldness="semiBold" classes="text-xl">
        {t("schedules.details.title")}
      </CustomText>
      <View className="h-10 w-10" />
    </View>
  );

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <View className="flex-1 mt-10 bg-primary p-5">
          {header}
          <EmptyState icon="alert-circle" title={t("schedules.details.not_found")} />
        </View>
      </SafeAreaView>
    );
  }

  const startTime = item.schedule?.scheduled_time?.start?.slice(0, 5) || "";
  const endTime = item.schedule?.scheduled_time?.end?.slice(0, 5) || "";
  const dateLabel = item.schedule?.date_label
    ? t(`schedules.date_label.${item.schedule.date_label}`)
    : "";
  const whenValue = [dateLabel, startTime && endTime ? `${startTime} - ${endTime}` : startTime]
    .filter(Boolean)
    .join(" · ");

  const priceLabel = renderMoney(item.amount_for_vendor ?? null);
  const durationLabel = formatEstimatedDuration(item.service_type?.time);
  const addressLabel = formatFullAddress(item.address_details, item.customer?.address);
  const addressExtra = formatAddressExtra(item.address_details);
  const customerNotes = formatCustomerNotes(item);
  const recurrenceKey = recurrenceLabelKey(item);

  const includes = item.service_type?.includes;
  const excludes = item.service_type?.excludes;
  const hasScope =
    (Array.isArray(includes) && includes.length > 0) ||
    (Array.isArray(excludes) && excludes.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 mt-10 bg-primary px-5">
        {header}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Identidade do serviço: o que é, e se este cliente volta. */}
          <Card>
            <View className="flex-row items-center">
              <IconTile size={52}>
                <Feather name="tool" size={22} color={Colors.brand} />
              </IconTile>
              <View className="flex-1 ml-3">
                <CustomText color="secondary" boldness="bold" size="large" numberOfLines={2}>
                  {item.service_type?.name}
                </CustomText>
                {!!recurrenceKey && (
                  <StatusPill
                    label={t(recurrenceKey)}
                    color={Colors.brand}
                    classes="mt-1.5"
                  />
                )}
              </View>
            </View>

            <View className="flex-row mt-4" style={{ gap: 10 }}>
              <View
                className="flex-1 rounded-2xl p-3 border"
                style={{ backgroundColor: Colors.card_high, borderColor: Colors.line }}
              >
                <CustomText color="muted" size="extraSmall" boldness="bold">
                  {t("schedules.details.when").toUpperCase()}
                </CustomText>
                <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2} classes="mt-1">
                  {whenValue || "—"}
                </CustomText>
              </View>

              <View
                className="flex-1 rounded-2xl p-3 border"
                style={{ backgroundColor: Colors.brand_soft, borderColor: `${Colors.brand}55` }}
              >
                <CustomText color="muted" size="extraSmall" boldness="bold">
                  {t("schedules.details.you_receive").toUpperCase()}
                </CustomText>
                <CustomText color="brand" boldness="bolder" size="medium" numberOfLines={1} classes="mt-1">
                  {priceLabel || "—"}
                </CustomText>
              </View>
            </View>

            <DetailRow
              icon="clock"
              label={t("schedules.details.duration")}
              value={durationLabel}
            />
          </Card>

          {/* Onde é e com quem. O telefone só vem depois de confirmado. */}
          <Card className="mt-4">
            <DetailRow
              icon="user"
              label={t("schedules.details.customer")}
              value={item.customer?.name}
            />
            <DetailRow
              icon="map-pin"
              label={t("schedules.details.address")}
              value={[addressLabel, addressExtra].filter(Boolean).join(" · ")}
            />
            <DetailRow
              icon="phone"
              label={t("schedules.details.phone")}
              value={item.customer?.phone}
            />
          </Card>

          {/* O que ficou combinado — e o que não ficou. */}
          <Card className="mt-4">
            {hasScope ? (
              <>
                <ScopeList
                  title={t("schedules.details.includes")}
                  items={includes}
                  positive
                />
                <ScopeList
                  title={t("schedules.details.excludes")}
                  items={excludes}
                  positive={false}
                />
              </>
            ) : (
              <CustomText color="muted" size="small">
                {t("schedules.details.includes_empty")}
              </CustomText>
            )}
          </Card>

          {/* O que o cliente escreveu e mandou. */}
          {(!!customerNotes || (item.customer_photos?.length ?? 0) > 0) && (
            <Card className="mt-4">
              {!!customerNotes && (
                <DetailRow
                  icon="message-square"
                  label={t("schedules.details.notes")}
                  value={customerNotes}
                />
              )}
              <CustomerPhotos photos={item.customer_photos} />
            </Card>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ScheduleDetailsBottomSheet;

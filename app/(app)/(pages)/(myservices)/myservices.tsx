/**
 * OS MEUS SERVIÇOS — áreas de operação do técnico e, dentro de cada uma, os tipos
 * de serviço que ele executa com a duração estimada e o que ganha por serviço.
 *
 * NOTA sobre os dados: `time` (minutos) e `starts_from` (€) existem na tabela
 * `services_types` do backend mas o endpoint do vendor ainda não os devolve, por isso
 * os chips de duração/ganho só aparecem quando os campos chegarem — nunca são inventados.
 * Ver utils/services.ts para o detalhe.
 */
import React, { useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useService } from "@/contexts/ServiceContext";
import { useSession } from "@/contexts/SessionContext";
import { useTranslation } from "react-i18next";
import { CustomText } from '@/components/CustomText';
import BackHeader from "@/components/app/BackHeader";
import TouchOpacity from '@/components/TouchOpacity';
import { Card, EmptyState, IconTile, SectionHeader } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { estimateVendorEarning, formatDuration, formatEuro } from '@/utils/services';
import { ServiceTypeInterface } from '@/types/services';
import BoltSm from "@/assets/icons/boltsm";

interface MyServicesProps{}


const MyServices: React.FC<MyServicesProps> = () => {
  const { t } = useTranslation();
  const { myOperationAreas } = useService();
  const { vendorData } = useSession();

  const [expanded, setExpanded] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState({
    wallet: false,
    operationAreas: false,
    vendorStatus: false
  });

  const hourRate = vendorData?.price_rate != null ? Number(vendorData.price_rate) : null;

  /** Linha de um tipo de serviço: nome + duração estimada + ganho (quando existirem). */
  const ServiceTypeRow = ({ serviceType, first }: { serviceType: ServiceTypeInterface; first: boolean }) => {
    const duration = formatDuration(serviceType.time);
    const earning = formatEuro(estimateVendorEarning(hourRate, serviceType.time));

    return (
      <View>
        {!first && <View style={{ height: 1, backgroundColor: Colors.line }} className="my-3" />}
        <View className="flex-row items-start">
          <CustomText color="secondary" size="small" boldness="medium" classes="flex-1 mr-3" numberOfLines={2}>
            {serviceType.name}
          </CustomText>
          {!!earning && (
            <CustomText color="brand" size="small" boldness="bold">
              {earning}
            </CustomText>
          )}
        </View>
        {!!duration && (
          <View className="flex-row items-center mt-1">
            <Feather name="clock" size={12} color={Colors.muted} />
            <CustomText color="muted" size="extraSmall" classes="ml-1.5">
              {t('my_services.duration', { value: duration })}
            </CustomText>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${Platform.OS === 'android' ? 'pb-[100px]' : 'pb-[50px]'}`} style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('profile.my_profile.labels.my_services')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionHeader
          title={t('home.my_areas')}
          action={t('home.my_areas_change')}
          onAction={() => router.push('/(app)/(bottom-sheets)/areas')}
        />

        {isLoading.operationAreas ? (
          <View className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={`loading-opa-${index}`}>
                <View className="flex-row items-center">
                  <View
                    className="h-10 w-10 rounded-xl"
                    style={{ backgroundColor: Colors.card_high }}
                  />
                  <View
                    className="h-4 rounded-full ml-4 flex-1"
                    style={{ backgroundColor: Colors.card_high }}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : myOperationAreas && myOperationAreas.length > 0 ? (
          <View className="space-y-3">
            {myOperationAreas.slice(0, 5).map((operationArea) => {
              const subscribedIds = operationArea?.services_types_subscribed;
              if (!subscribedIds || subscribedIds.length === 0) {
                return null;
              }

              // Só os tipos de serviço a que o técnico está inscrito.
              const subscribed = (operationArea?.services_types ?? []).filter(
                (serviceType) => subscribedIds.includes(serviceType.id)
              );
              const isOpen = expanded === operationArea.id;

              return (
                <Card key={operationArea.id}>
                  <TouchOpacity
                    onPress={() => setExpanded((prev) => (prev === operationArea.id ? null : operationArea.id))}
                    otherClasses="flex-row items-center"
                  >
                    <IconTile>
                      <BoltSm color={Colors.brand} size={18} filled={false} />
                    </IconTile>
                    <CustomText
                      boldness="semiBold"
                      color="secondary"
                      size="medium"
                      classes="flex-1 ml-3"
                      numberOfLines={2}
                    >
                      {operationArea.name}
                    </CustomText>
                    <CustomText color="muted" boldness="semiBold" size="medium" classes="mr-2">
                      {String(subscribedIds.length)}
                    </CustomText>
                    {subscribed.length > 0 && (
                      <Feather
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.muted}
                      />
                    )}
                  </TouchOpacity>

                  {isOpen && subscribed.length > 0 && (
                    <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: Colors.line }}>
                      {subscribed.map((serviceType, index) => (
                        <ServiceTypeRow
                          key={serviceType.id}
                          serviceType={serviceType}
                          first={index === 0}
                        />
                      ))}
                    </View>
                  )}
                </Card>
              )
            })}
          </View>
        ) : (
          <EmptyState icon="zap" title={t('home.my_areas_empty')} />
        )}

        {!!hourRate && (
          <>
            <SectionHeader title={t('my_services.earnings_title')} classes="mt-8" />
            <Card>
              <View className="flex-row items-center">
                <IconTile>
                  <Feather name="dollar-sign" size={18} color={Colors.brand} />
                </IconTile>
                <View className="flex-1 ml-3">
                  <CustomText color="muted" size="extraSmall">
                    {t('my_services.hour_rate_label')}
                  </CustomText>
                  <CustomText color="brand" size="large" boldness="bold">
                    {t('my_services.hour_rate_value', { value: formatEuro(hourRate) })}
                  </CustomText>
                </View>
                <TouchOpacity
                  onPress={() => router.push('/(app)/(pages)/(hourly-rate)/hourly-rate')}
                  otherClasses="flex-row items-center"
                >
                  <CustomText color="brand" size="extraSmall" boldness="bold">
                    {t('my_services.change_rate')}
                  </CustomText>
                  <Feather name="chevron-right" size={16} color={Colors.brand} />
                </TouchOpacity>
              </View>
              <CustomText color="muted" size="extraSmall" classes="mt-3" numberOfLines={3}>
                {t('my_services.earnings_hint')}
              </CustomText>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyServices;

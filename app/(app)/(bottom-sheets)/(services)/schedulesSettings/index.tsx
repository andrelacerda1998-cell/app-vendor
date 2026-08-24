/**
 * DEFINIÇÕES DE AGENDAMENTO — zona de serviço, auto-aceitação e disponibilidade semanal.
 * Re-skin para a linguagem build-12 (fundo bg, <Card>, hairlines Colors.line).
 * A lógica de gravação e os endpoints mantêm-se inalterados.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Switch, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import BackHeader from "@/components/app/BackHeader";
import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import TouchOpacity from "@/components/TouchOpacity";
import { Card, IconTile, SectionHeader } from "@/components/ui";
import { Colors } from "@/constants/Colors";
import Address from "@/app/(app)/(modals)/schedules/Address";
import Confirmation, { MessageConfirmation } from "@/app/(app)/(modals)/schedules/Confirmation";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useSession } from "@/contexts/SessionContext";
import AvailabilityElements from "@/components/app/Schedule/AvailabilityElements";
import { AddressData } from "@/types/schedule";
import { useSchedule } from "@/contexts/ScheduleContext";
import { useLocation } from "@/contexts/LocationContext";

const ServiceSchedulesSettingsBottomSheets = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData } = useSession();
  const { weekdays, address, setAddress, autoAcceptEnabled, setAutoAcceptEnabled } = useSchedule();

  const { getCurrentLocation } = useLocation();

  const [addressOpen, setAddressOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [detected, setDetected] = useState(false);
  const [messageConfirmation, setMessageConfirmation] = useState<MessageConfirmation>({ title: '', subtitle: ''});
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const saveAddress = (nextAddress: AddressData) => {
    setAddress(nextAddress);
    setDetected(false);
    setAddressOpen(false);
  }

  /**
   * Preenche a zona de serviço a partir do GPS. O técnico está quase sempre
   * na sua zona de trabalho, por isso escrever a morada à mão era trabalho
   * repetido — fica pré-preenchida e ele só corrige se for preciso.
   */
  const detectCurrentLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    setLocationFailed(false);
    try {
      // Não dependemos do getCurrentLocation do contexto: esse também comunica a
      // posição ao servidor e devolve null se essa chamada falhar — aqui só
      // queremos as coordenadas para preencher a morada.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationFailed(true); return; }

      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (!position) { setLocationFailed(true); return; }

      // Best-effort: mantém o servidor a par da posição, sem bloquear o preenchimento.
      getCurrentLocation().catch(() => {});

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (!place) { setLocationFailed(true); return; }

      setAddress({
        street: place.street ?? place.name ?? '',
        number: place.streetNumber ?? '',
        city: place.city ?? place.subregion ?? place.region ?? '',
        postalCode: place.postalCode ?? '',
      });
      setDetected(true);
    } catch {
      setLocationFailed(true);
    } finally {
      setLocating(false);
    }
  }, [getCurrentLocation, locating, setAddress]);

  // Sem morada guardada, tenta detetar assim que o ecrã abre.
  const triedAutoRef = React.useRef(false);
  useEffect(() => {
    if (triedAutoRef.current || address) return;
    triedAutoRef.current = true;
    detectCurrentLocation();
  }, [address, detectCurrentLocation]);

  const autoAcceptConfirmation = () => {
    if (autoAcceptEnabled) {
      setAutoAcceptEnabled(false)
      return
    }

    setMessageConfirmation({
      title: t('schedules.confirmation.auto_accept_title'),
      subtitle: t('schedules.confirmation.auto_accept_subtitle')
    })
    setConfirmationVisible(true)
  }

  const confirmAutoAccept = () => {
    setAutoAcceptEnabled(prev => !prev)
    setConfirmationVisible(false)
  }

  const saveSettings = () => {
    if (!vendorData) return;

    const available_days = weekdays.reduce<Record<string, any>>((acc, day) => {
      acc[day.key] = {
        auto_accept: autoAcceptEnabled,
        time_start: day.start,
        time_end: day.end,
        is_enabled: day.enabled
      };

      return acc;
    }, {});

    const payload = {
      address: {
        street_name: address?.street,
        street_number: address?.number,
        city: address?.city,
        postal_code: address?.postalCode,
        address_name: `${address?.street}, ${address?.number}, ${address?.city}, ${address?.postalCode}`
      },
      user_id: vendorData.user_id,
      available_days
    };

    api.post(API_ROUTES.VENDOR_UPDATE_SCHEDULE_SETTINGS, payload).then(res => {
      router.navigate('/(app)/(tabs)/home');
    }).catch((err: any) => {
      console.error("Error saving schedule settings:", err);
    });
  }

  const addressLabel = address
    ? `${address.street}, ${address.number}, ${address.city}, ${address.postalCode}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('schedules.availability')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 40 : 24 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t('schedules.service_zone')} />
        <Card padded={false}>
          <View className="flex-row items-center p-4">
            <IconTile size={44}>
              {locating
                ? <ActivityIndicator size="small" color={Colors.brand} />
                : <Feather name="map-pin" size={19} color={Colors.brand} />}
            </IconTile>

            <View className="flex-1 ml-3">
              {locating ? (
                <CustomText color="muted" size="small" boldness="medium">
                  {t('schedules.address.locating')}
                </CustomText>
              ) : address ? (
                <>
                  <CustomText color="secondary" size="medium" boldness="semiBold" numberOfLines={1}>
                    {[address.street, address.number].filter(Boolean).join(', ')}
                  </CustomText>
                  <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={1}>
                    {[address.postalCode, address.city].filter(Boolean).join(' · ')}
                  </CustomText>
                </>
              ) : (
                <CustomText color="muted" size="small" boldness="medium" numberOfLines={2}>
                  {locationFailed
                    ? t('schedules.address.locate_failed')
                    : t('schedules.address.insert_address')}
                </CustomText>
              )}
            </View>

            <TouchOpacity onPress={() => setAddressOpen(true)} otherClasses="pl-3">
              <CustomText color="brand" size="extraSmall" boldness="bold">
                {t('schedules.edit')}
              </CustomText>
            </TouchOpacity>
          </View>

          {/* Detetada pelo GPS — dá para repetir se o técnico mudou de zona. */}
          {detected && !locating && (
            <View
              className="flex-row items-center px-4 pb-3"
              style={{ marginTop: -4 }}
            >
              <Feather name="check-circle" size={12} color={Colors.success} />
              <CustomText color="success" size="extraSmall" boldness="semiBold" classes="ml-1.5">
                {t('schedules.address.detected')}
              </CustomText>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: Colors.line }} />
          <TouchableOpacity
            onPress={detectCurrentLocation}
            disabled={locating}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-3"
            style={{ opacity: locating ? 0.5 : 1 }}
          >
            <Feather name="crosshair" size={14} color={Colors.brand} />
            <CustomText color="brand" size="small" boldness="bold" classes="ml-2">
              {t('schedules.address.use_current')}
            </CustomText>
          </TouchableOpacity>
        </Card>

        <SectionHeader title={t('schedules.settings_schedule')} classes="mt-8" />
        <Card>
          <View className="flex-row items-center">
            <View className="flex-1 mr-3">
              <CustomText color="secondary" size="medium" boldness="semiBold" numberOfLines={1}>
                {t('schedules.auto_acceptance')}
              </CustomText>
              <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={2}>
                {autoAcceptEnabled ? t('schedules.auto_accept_on') : t('schedules.auto_accept_off')}
              </CustomText>
            </View>
            <Switch
              value={autoAcceptEnabled}
              onValueChange={autoAcceptConfirmation}
              trackColor={{ false: Colors.card_high, true: Colors.brand }}
              thumbColor={Colors.secondary}
            />
          </View>
        </Card>

        <SectionHeader title={t('schedules.availability_schedule')} classes="mt-8" />
        <Card>
          <AvailabilityElements />
        </Card>

        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textSize="medium"
          textColor="on_brand"
          textBoldness="bold"
          text={t('schedules.continue')}
          onPress={saveSettings}
          classes="mt-6"
        />
      </ScrollView>

      <Address
        visible={addressOpen}
        onClose={() => setAddressOpen(false)}
        onSave={(address) => saveAddress(address)}
        initialValue={address ?? undefined}
      />
      <Confirmation
        visible={confirmationVisible}
        message={messageConfirmation}
        onConfirm={() => confirmAutoAccept()}
        onCancel={() => setConfirmationVisible(false)}
      />
    </SafeAreaView>
  );
}

export default ServiceSchedulesSettingsBottomSheets;

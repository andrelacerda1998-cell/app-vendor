import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import createStyles from './index.module';
import Checkbox from "@/components/Checkbox";
import Address from "@/app/(app)/(modals)/schedules/Address";
import {useTranslation} from "react-i18next";
import Confirmation, {MessageConfirmation} from "@/app/(app)/(modals)/schedules/Confirmation";
import { useApi } from "@/contexts/ApiContext";
import { API_ROUTES } from "@/constants/ApiRoutes";
import { useSession } from "@/contexts/SessionContext";
import AvailabilityElements from "@/components/app/Schedule/AvailabilityElements";
import {AddressData} from "@/types/schedule";
import { useSchedule } from "@/contexts/ScheduleContext";

const { width } = Dimensions.get("window");

const ServiceSchedulesSettingsBottomSheets = () => {
  const { t } = useTranslation();
  const styles = createStyles(width);
  const { api } = useApi();
  const { vendorData } = useSession();
  const { weekdays, address, setAddress, autoAcceptEnabled, setAutoAcceptEnabled } = useSchedule();

  const [addressOpen, setAddressOpen] = useState(false);
  const [messageConfirmation, setMessageConfirmation] = useState<MessageConfirmation>({ title: '', subtitle: ''});
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const saveAddress = (nextAddress: AddressData) => {
    setAddress(nextAddress);
    setAddressOpen(false);
  }

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

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AntDesign name="left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('schedules.availability')}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('schedules.service_zone')}</Text>

        <View style={styles.addressRow}>
          <Text style={styles.addressText}>
            {address ? `${address.street}, ${address.number}, ${address.city}, ${address.postalCode}` : ""}
          </Text>
          <TouchableOpacity onPress={() => setAddressOpen(true)}>
            <Text style={styles.editText}>{t('schedules.edit')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSchedule}>
          <View style={styles.settingsHeaderRow}>
            <Text style={styles.settingsTitle}>{t('schedules.settings_schedule')}</Text>
          </View>
          <View style={styles.settingsOptions}>
            <Checkbox label={t('schedules.auto_acceptance')} checked={autoAcceptEnabled} onChange={autoAcceptConfirmation} />
          </View>
        </View>

        <AvailabilityElements />
      </View>

      <Pressable style={styles.continueButton} android_ripple={{ color: "#00000022" }} onPress={saveSettings}>
        <Text style={styles.continueText}>{t('schedules.continue')}</Text>
      </Pressable>

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

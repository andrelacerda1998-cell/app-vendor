/**
 * AUTO ACEITAÇÃO — ecrã dedicado para ativar/desativar e perceber como funciona.
 * Inspirado no ecrã Flutter piquet_pro/lib/screens/availability/auto_acceptance_screen.dart
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather, Entypo } from '@expo/vector-icons';

import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Card, SectionHeader } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSchedule } from '@/contexts/ScheduleContext';

const AutoAcceptance = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { autoAcceptEnabled, setAutoAcceptEnabled, getScheduleSettings } = useSchedule();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getScheduleSettings();
  }, []);

  const persist = async (enabled: boolean) => {
    setSaving(true);
    const previous = autoAcceptEnabled;
    setAutoAcceptEnabled(enabled); // otimista
    try {
      await api.put(API_ROUTES.VENDOR_UPDATE_AUTO_ACCEPT, { enabled });
    } catch (e) {
      setAutoAcceptEnabled(previous); // reverte em erro
    } finally {
      setSaving(false);
    }
  };

  const onToggle = () => {
    if (saving) return;
    if (autoAcceptEnabled) {
      persist(false);
      return;
    }
    openDialog({
      title: t('schedules.confirmation.auto_accept_title'),
      subtitle: t('schedules.confirmation.auto_accept_subtitle'),
      successButtonText: t('schedules.auto_accept_enable'),
      cancelButtonText: t('general.cancel'),
      onSuccess: () => persist(true),
    });
  };

  const bullets: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
    { icon: 'clock', text: t('auto_acceptance.how_it_works.availability') },
    { icon: 'bell', text: t('auto_acceptance.how_it_works.notification') },
    { icon: 'user-check', text: t('auto_acceptance.how_it_works.customer') },
    { icon: 'check-circle', text: t('auto_acceptance.how_it_works.responsibility') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('auto_acceptance.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Estado atual + interruptor */}
        <Card className="flex-row items-center">
          <Entypo name="flash" size={28} color={autoAcceptEnabled ? Colors.brand : Colors.muted} />
          <View className="flex-1 ml-3 mr-2">
            <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
              {autoAcceptEnabled
                ? t('auto_acceptance.state.on_title')
                : t('auto_acceptance.state.off_title')}
            </CustomText>
            <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={3}>
              {autoAcceptEnabled
                ? t('auto_acceptance.state.on_subtitle')
                : t('auto_acceptance.state.off_subtitle')}
            </CustomText>
          </View>
          <Switch
            value={autoAcceptEnabled}
            onValueChange={onToggle}
            disabled={saving}
            trackColor={{ false: Colors.gray_strong, true: Colors.brand }}
            thumbColor={Colors.secondary}
            ios_backgroundColor={Colors.gray_strong}
          />
        </Card>

        {/* Como funciona */}
        <SectionHeader title={t('auto_acceptance.how_it_works.title')} classes="mt-8" />
        <Card>
          {bullets.map((bullet, i) => (
            <View key={bullet.icon} className={`flex-row ${i > 0 ? 'mt-4' : ''}`}>
              <View className="mt-1">
                <Feather name={bullet.icon} size={16} color={Colors.brand} />
              </View>
              <CustomText color="secondary" size="small" classes="flex-1 ml-3" numberOfLines={4}>
                {bullet.text}
              </CustomText>
            </View>
          ))}
        </Card>

        {/* Aviso */}
        <View
          className="flex-row rounded-2xl border p-4 mt-6"
          style={{
            backgroundColor: 'rgba(233,162,59,0.12)',
            borderColor: 'rgba(233,162,59,0.3)',
          }}
        >
          <View className="mt-1">
            <Feather name="alert-triangle" size={16} color={Colors.warning} />
          </View>
          <CustomText color="secondary" size="small" classes="flex-1 ml-3" numberOfLines={4}>
            {t('auto_acceptance.warning')}
          </CustomText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AutoAcceptance;

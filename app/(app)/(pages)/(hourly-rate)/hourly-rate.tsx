/**
 * VALOR/HORA — o técnico vê e edita o seu valor/hora, com simulação de ganhos.
 * Inspirado no ecrã Flutter piquet_pro/lib/screens/pricing/hourly_rate_screen.dart
 */
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Card, SectionHeader } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import RateSlider from '@/components/ui/RateSlider';
import CheckMark from '@/assets/icons/check-mark';
import XIcon from '@/assets/icons/x';

const RATE_MIN = 8;
const RATE_MAX = 50;
const MARKET_MIN = 14;
const MARKET_MAX = 22;

const formatEuro = (v: number) => `${(Number(v) || 0).toFixed(2).replace('.', ',')} €`;

const HourlyRate = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { vendorData } = useSession();

  const initialRate = Math.round(Number(vendorData?.price_rate) || 15);
  const [rate, setRate] = useState<number>(Math.max(RATE_MIN, Math.min(RATE_MAX, initialRate)));
  const [saving, setSaving] = useState(false);

  const marketState = rate < MARKET_MIN ? 'below' : rate > MARKET_MAX ? 'above' : 'within';
  const hintColor = marketState === 'within' ? Colors.success : Colors.warning;
  const hintIcon =
    marketState === 'below' ? 'trending-down' : marketState === 'above' ? 'trending-up' : 'check-circle';

  const simulations: { label: string; hours: number }[] = [
    { label: t('hourly_rate.simulation.one_hour'), hours: 1 },
    { label: t('hourly_rate.simulation.two_hours'), hours: 2 },
    { label: t('hourly_rate.simulation.two_hours_thirty'), hours: 2.5 },
  ];

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.put(API_ROUTES.VENDOR_UPDATE_PRICE_RATE, { rate });
      openDialog({
        icon: <CheckMark color={Colors.primary} />,
        title: t('hourly_rate.saved_title'),
        subtitle: t('hourly_rate.saved_subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
    } catch {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.hourly_rate_save.title'),
        subtitle: t('errors.hourly_rate_save.subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('hourly_rate.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Valor + slider */}
        <Card className="pt-6 pb-5">
          <CustomText
            color="secondary"
            size="headline"
            boldness="bolder"
            classes="text-center"
            numberOfLines={1}
          >
            {formatEuro(rate)}
          </CustomText>
          <CustomText color="muted" size="small" classes="text-center mt-1" numberOfLines={1}>
            {t('hourly_rate.your_rate_label')}
          </CustomText>

          <View className="mt-6 px-1">
            <RateSlider
              value={rate}
              onChange={setRate}
              min={RATE_MIN}
              max={RATE_MAX}
              accessibilityLabel={t('hourly_rate.your_rate_label')}
            />
            <View className="flex-row justify-between mt-2">
              <CustomText color="muted" size="extraSmall">{formatEuro(RATE_MIN)}</CustomText>
              <CustomText color="muted" size="extraSmall">{formatEuro(RATE_MAX)}</CustomText>
            </View>
          </View>

          {/* Dica de mercado */}
          <View
            className="flex-row items-center rounded-xl p-3 mt-6"
            style={{
              backgroundColor:
                marketState === 'within' ? 'rgba(35,230,158,0.12)' : 'rgba(233,162,59,0.12)',
            }}
          >
            <Feather name={hintIcon as any} size={18} color={hintColor} />
            <CustomText size="small" boldness="regular" classes="ml-2 flex-1" numberOfLines={3} color="secondary">
              {t('auth.sign_up.price_rate.market_range', {
                min: formatEuro(MARKET_MIN),
                max: formatEuro(MARKET_MAX),
              })}{' '}
              {t(`auth.sign_up.price_rate.market_${marketState}`)}
            </CustomText>
          </View>
        </Card>

        {/* Simulação de ganhos */}
        <SectionHeader title={t('hourly_rate.earnings_title')} classes="mt-8" />
        <Card padded={false}>
          {simulations.map((sim, i) => (
            <View key={sim.label}>
              {i > 0 && <View style={{ height: 1, backgroundColor: Colors.line }} />}
              <View className="flex-row items-center justify-between px-4 py-4">
                <CustomText color="muted" size="medium" numberOfLines={1} classes="flex-1 pr-3">
                  {sim.label}
                </CustomText>
                <CustomText color="secondary" size="medium" boldness="bolder" numberOfLines={1}>
                  {formatEuro(rate * sim.hours)}
                </CustomText>
              </View>
            </View>
          ))}
        </Card>

        <CustomText size="small" color="muted" classes="mt-4" numberOfLines={4}>
          {t('hourly_rate.margin_note')}
        </CustomText>

        <CustomTouchableOpacity
          type="primary"
          size="large"
          text={saving ? t('hourly_rate.saving') : t('hourly_rate.save')}
          textSize="medium"
          textColor="on_brand"
          textBoldness="bold"
          onPress={save}
          disabled={saving}
          classes="mt-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HourlyRate;

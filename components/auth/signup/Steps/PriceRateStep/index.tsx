import { SignUpData } from '@/app/(auth)/signup';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import RateSlider from '@/components/ui/RateSlider';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Control, Controller, FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from "react-i18next";
import { View } from 'react-native';
import { ScrollView } from 'react-native';

const RATE_MIN = 8;
const RATE_MAX = 50;
const MARKET_MIN = 14;
const MARKET_MAX = 22;

const formatEuro = (v: number) => `${(Number(v) || 0).toFixed(2).replace('.', ',')} €`;

const PriceRateStep = ({
  control,
  errors,
}: {
  control: Control<SignUpData, any>,
  errors: FieldErrors<FieldValues>,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, width: "100%", padding: 20 }}>
      <CustomText color="secondary" size="subtitle" boldness="bolder" numberOfLines={2}>
        {t('general.price_rate.title')}
      </CustomText>
      <CustomText color="muted" size="small" numberOfLines={3} classes="mt-1">
        {t('auth.sign_up.price_rate.subtitle')}
      </CustomText>

      <Controller
        control={control}
        name="price_rate"
        rules={{
          validate: (value) => {
            if (!value) return t('general.price_rate.required');
            else if (isNaN(value)) return t('general.price_rate.must_be_number');
            else if (value < 1) return t('general.price_rate.min_value');
            else if (value > 999999) return t('general.price_rate.max_value');
            return true;
          }
        }}
        render={({ field }) => {
          const rate = Math.round(Number(field.value) || RATE_MIN + 7);
          const marketState = rate < MARKET_MIN ? 'below' : rate > MARKET_MAX ? 'above' : 'within';
          const hintColor = marketState === 'within' ? Colors.success : Colors.warning;
          const hintIcon = marketState === 'below' ? 'trending-down' : marketState === 'above' ? 'trending-up' : 'check-circle';

          return (
            <View>
              {/* Valor grande */}
              <CustomText color="secondary" size="headline" boldness="bolder" classes="text-center mt-8" numberOfLines={1}>
                {formatEuro(rate)}
              </CustomText>
              <CustomText color="muted" size="small" classes="text-center" numberOfLines={1}>
                {t('auth.sign_up.price_rate.your_rate_label')}
              </CustomText>

              {/* Slider */}
              <View className="mt-6 px-1">
                <RateSlider
                  value={rate}
                  onChange={(v) => field.onChange(v)}
                  min={RATE_MIN}
                  max={RATE_MAX}
                  accessibilityLabel={t('general.price_rate.title')}
                />
                <View className="flex-row justify-between mt-2">
                  <CustomText color="muted" size="extraSmall">{formatEuro(RATE_MIN)}</CustomText>
                  <CustomText color="muted" size="extraSmall">{formatEuro(RATE_MAX)}</CustomText>
                </View>
              </View>

              {/* Dica de mercado */}
              <View
                className="flex-row items-center rounded-xl p-3 mt-6"
                style={{ backgroundColor: marketState === 'within' ? 'rgba(35,230,158,0.12)' : 'rgba(233,162,59,0.12)' }}
              >
                <Feather name={hintIcon as any} size={18} color={hintColor} />
                <CustomText size="small" boldness="regular" classes="ml-2 flex-1" numberOfLines={3} color="secondary">
                  {t('auth.sign_up.price_rate.market_range', { min: formatEuro(MARKET_MIN), max: formatEuro(MARKET_MAX) })}{' '}
                  {t(`auth.sign_up.price_rate.market_${marketState}`)}
                </CustomText>
              </View>

              {errors.price_rate && errors.price_rate.message && (
                <CustomText size="small" color="danger" classes="mt-3" numberOfLines={3}>
                  {errors.price_rate.message as string}
                </CustomText>
              )}
              <CustomText size="small" color="muted" classes="mt-4" numberOfLines={3}>
                {t('auth.sign_up.price_rate.information')}
              </CustomText>
            </View>
          );
        }}
      />
    </ScrollView>
  )
}

export default PriceRateStep;

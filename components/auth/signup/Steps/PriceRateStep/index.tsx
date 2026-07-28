import { SignUpData } from '@/app/(auth)/signup';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Control, Controller, FieldErrors, FieldValues } from 'react-hook-form';
import { useTranslation } from "react-i18next";
import { PanResponder, View } from 'react-native';
import { ScrollView } from 'react-native';

const RATE_MIN = 8;
const RATE_MAX = 50;
const MARKET_MIN = 14;
const MARKET_MAX = 22;
const THUMB = 26;

const formatEuro = (v: number) => `${(Number(v) || 0).toFixed(2).replace('.', ',')} €`;

// Slider em JS puro (sem dependência nativa)
const RateSlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const widthRef = useRef(0);
  const [, force] = useState(0);

  const clamp = (v: number) => Math.max(RATE_MIN, Math.min(RATE_MAX, v));
  const xToValue = (x: number) => {
    const w = widthRef.current || 1;
    return clamp(Math.round(RATE_MIN + (x / w) * (RATE_MAX - RATE_MIN)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChange(xToValue(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChange(xToValue(e.nativeEvent.locationX)),
    })
  ).current;

  const pct = (clamp(value) - RATE_MIN) / (RATE_MAX - RATE_MIN);
  const w = widthRef.current;
  const thumbLeft = pct * Math.max(0, w - THUMB);

  return (
    <View
      className="h-7 justify-center"
      onLayout={(ev) => {
        widthRef.current = ev.nativeEvent.layout.width;
        force((n) => n + 1);
      }}
      {...pan.panHandlers}
    >
      {/* trilho */}
      <View className="h-1.5 rounded-full" style={{ backgroundColor: Colors.card_high }} />
      {/* preenchimento */}
      <View
        className="h-1.5 rounded-full absolute"
        style={{ backgroundColor: Colors.brand, width: Math.max(THUMB / 2, thumbLeft + THUMB / 2) }}
      />
      {/* thumb */}
      <View
        className="absolute rounded-full"
        style={{
          width: THUMB,
          height: THUMB,
          left: thumbLeft,
          backgroundColor: Colors.brand,
          borderWidth: 3,
          borderColor: Colors.bg,
        }}
      />
    </View>
  );
};

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
                <RateSlider value={rate} onChange={(v) => field.onChange(v)} />
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

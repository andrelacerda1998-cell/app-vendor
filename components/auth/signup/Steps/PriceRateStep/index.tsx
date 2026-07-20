import { SignUpData } from '@/app/(auth)/signup';
import Checkbox from '@/components/Checkbox';
import { CustomText } from '@/components/CustomText';
import CustomTextInput from '@/components/CustomTextInput';
import DatePicker from '@/components/DatePicker';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Control, Controller, FieldErrors, FieldValues, UseFormSetValue } from 'react-hook-form';
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native';
import CurrencyInput from 'react-native-currency-input';

const PriceRateStep = ({
  control,
  errors,
  // availableOperationAreas,
  // selectedOperationAreas,
  // setSelectedOperationAreas,
  // setValue
}: {
  control: Control<SignUpData, any>,
  errors: FieldErrors<FieldValues>,
  // availableOperationAreas: any,
  // selectedOperationAreas: number[],
  // setSelectedOperationAreas: (areas: number[] | ((prev: number[]) => number[])) => void,
  // setValue: UseFormSetValue<SignUpData>
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    // send request to get the suggested price per hour
    // setValue('price_rate', "800");
  }, []);

  return (
    <ScrollView contentContainerStyle={{
      flexGrow: 1,
      width: "100%",
      padding: 20
    }}>
      <View className="mx-auto items-center justify-center rounded-full border-4 border-support_primary w-14 h-14">
        <FontAwesome name="euro" size={26} color={Colors.support_primary} />
      </View>
      {/* <View className="flex-row items-center justify-center">
        <FontAwesome6 name="dollar-sign" size={48} color={Colors.secondary} />
        <CustomText color="secondary" size="headline" boldness="bold" numberOfLines={1} classes="text-center p-4 mt-4">
          11.00
        </CustomText>
      </View> */}
      <CustomText color="secondary" size="small" numberOfLines={3} classes="text-center mt-4">
        {t('auth.sign_up.price_rate.subtitle')}
      </CustomText>

      <View className="mt-8">
        <CustomText color="secondary" boldness="bold" numberOfLines={1}>
          {t('general.price_rate.title')}
        </CustomText>
        <Controller
          control={control}
          name="price_rate"
          rules={{
            validate: (value) => {
              if (!value) {
                return t('general.price_rate.required');
              } else if (isNaN(value)) {
                return t('general.price_rate.must_be_number');
              } else if (value < 1) {
                return t('general.price_rate.min_value');
              } else if (value > 999999) {
                return t('general.price_rate.max_value');
              }
              return true;
            }
          }}
          render={({ field }) => (
            <View className="relative justify-center mt-2">
              <CurrencyInput
                {...field}
                onChangeValue={(value) => {
                  field.onChange(value);
                }}
                renderTextInput={textInputProps => (
                  <CustomTextInput
                    {...textInputProps}
                    size="large"
                    keyboardType="numeric"
                    placeholder={t('general.price_rate.placeholder')}
                    classes=""
                  />
                )}
                prefix="€ "
                suffix=" / h"
                delimiter=" "
                separator=","
                precision={2}
              />
            </View>
          )}
        />
        {errors.price_rate && errors.price_rate.message && (
          <CustomText
            size="small"
            color="error"
            classes="mt-2"
            numberOfLines={3}
          >
            {errors.price_rate.message as string}
          </CustomText>
        )}
        <CustomText
          size="small"
          color="gray_medium"
          classes="mt-2"
          numberOfLines={3}
        >
          {t('auth.sign_up.price_rate.information')}
        </CustomText>
      </View>
    </ScrollView>
  )
}

export default PriceRateStep;
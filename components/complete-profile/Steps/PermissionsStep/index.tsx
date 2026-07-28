import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';

/**
 * Explica PORQUÊ pedimos notificações e localização ANTES de o sistema
 * mostrar o diálogo nativo. Sem isto o técnico vê dois pop-ups do SO
 * sem contexto e recusa — e depois não recebe pedidos.
 */
const PermissionsStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);

  const requestAll = async () => {
    setAsking(true);
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Permissão indisponível (simulador/SO): seguimos na mesma.
    }

    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status === 'granted' && Platform.OS === 'android') {
        await Location.requestBackgroundPermissionsAsync();
      }
    } catch {
      // idem
    }

    setAsking(false);
    onNext();
  };

  const cards = [
    {
      icon: 'notifications-outline',
      title: t('complete_profile.permissions.notifications.title'),
      description: t('complete_profile.permissions.notifications.description'),
    },
    {
      icon: 'location-outline',
      title: t('complete_profile.permissions.location.title'),
      description: t('complete_profile.permissions.location.description'),
    },
  ];

  return (
    <View className="flex-1 p-5">
      <CustomText size="subtitle" color="secondary" boldness="bolder" numberOfLines={2}>
        {t('complete_profile.permissions.title')}
      </CustomText>
      <CustomText color="muted" numberOfLines={3} classes="mt-1">
        {t('complete_profile.permissions.subtitle')}
      </CustomText>

      <View className="flex-1 mt-6" style={{ gap: 12 }}>
        {cards.map((card) => (
          <View
            key={card.icon}
            className="flex-row bg-card border rounded-2xl p-4"
            style={{ borderColor: Colors.line }}
          >
            <Ionicons name={card.icon as any} size={22} color={Colors.brand} />
            <View className="flex-1 ml-3">
              <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                {card.title}
              </CustomText>
              <CustomText color="muted" size="small" numberOfLines={4} classes="mt-1">
                {card.description}
              </CustomText>
            </View>
          </View>
        ))}

        <CustomText color="muted" size="small" numberOfLines={3} classes="mt-1">
          {t('complete_profile.permissions.footnote')}
        </CustomText>
      </View>

      <View className="pt-4" style={{ gap: 12 }}>
        <CustomTouchableOpacity
          size="large"
          type="support_primary"
          textColor="on_brand"
          textBoldness="bold"
          text={asking
            ? t('complete_profile.permissions.asking')
            : t('complete_profile.permissions.allow')}
          onPress={requestAll}
          disabled={asking}
        />
        <CustomTouchableOpacity
          size="large"
          type="transparent"
          textColor="muted"
          textBoldness="regular"
          text={t('complete_profile.permissions.later')}
          onPress={onNext}
          classes="self-center"
          disabled={asking}
        />
      </View>
    </View>
  );
};

export default PermissionsStep;

/**
 * Aviso de notificações desligadas.
 *
 * Sem notificações o técnico não é avisado de novos pedidos — deixa de ganhar
 * dinheiro sem perceber porquê. Antes, recusar a permissão não produzia sinal
 * nenhum na app.
 */
import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { cardShadow } from '@/components/ui';
import { useNotificationPermission } from '@/contexts/NotificationsContext';

const NotificationsDisabledBanner = () => {
  const { t } = useTranslation();
  const { permissionDenied } = useNotificationPermission();

  if (!permissionDenied) return null;

  const openSettings = () => {
    // Depois de recusada, a permissão só se recupera nas Definições do sistema.
    if (Platform.OS === 'ios') Linking.openURL('app-settings:');
    else Linking.openSettings();
  };

  return (
    <View className="px-5">
      <TouchableOpacity activeOpacity={0.85} onPress={openSettings}>
        <LinearGradient
          colors={['rgba(255,90,95,0.32)', 'rgba(255,90,95,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            { borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,90,95,0.55)' },
            cardShadow,
          ]}
        >
          <View className="flex-row items-center p-4">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: Colors.danger }}
            >
              <Feather name="bell-off" size={20} color={Colors.secondary} />
            </View>
            <View className="flex-1">
              <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                {t('notifications_disabled.title')}
              </CustomText>
              <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={3}>
                {t('notifications_disabled.subtitle')}
              </CustomText>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.danger} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default NotificationsDisabledBanner;

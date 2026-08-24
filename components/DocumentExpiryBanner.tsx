/**
 * Aviso de documento a expirar ou já expirado.
 *
 * Regra de negócio: o técnico aceita serviços até ao ÚLTIMO DIA de validade;
 * a partir daí fica bloqueado até regularizar. Este aviso existe porque, antes,
 * a informação de validade só aparecia dentro do ecrã de Documentos — quem não
 * o abrisse descobria o problema quando deixava de receber trabalho.
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { cardShadow } from '@/components/ui';
import { useSession } from '@/contexts/SessionContext';

type ExpiringDocument = { name: string; days_to_expire: number | null; is_expired?: boolean };

const DocumentExpiryBanner = () => {
  const { t } = useTranslation();
  const { vendorData } = useSession();

  // Vem no payload do vendor, para não custar mais um pedido no arranque.
  const documents: ExpiringDocument[] = (vendorData as any)?.expiring_documents ?? [];
  if (documents.length === 0) return null;

  // O mais urgente manda no aspeto do aviso.
  const worst = documents.reduce((a, b) =>
    (a.days_to_expire ?? 999) <= (b.days_to_expire ?? 999) ? a : b
  );
  const expired = worst.is_expired || (worst.days_to_expire ?? 1) < 0;
  const tone = expired ? Colors.danger : Colors.warning;

  const title = expired
    ? t('document_expiry.expired_title', { name: worst.name })
    : t('document_expiry.expiring_title', { name: worst.name, count: worst.days_to_expire ?? 0 });

  const subtitle = expired
    ? t('document_expiry.expired_subtitle')
    : t('document_expiry.expiring_subtitle');

  return (
    <View className="px-5">
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        onPress={() => router.push('/(app)/(pages)/(mydocuments)/mydocuments')}
      >
        <LinearGradient
          colors={[`${tone}4D`, `${tone}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: 16, borderWidth: 1.5, borderColor: `${tone}8C` }, cardShadow]}
        >
          <View className="flex-row items-center p-4">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: tone }}
            >
              <Feather name={expired ? 'alert-circle' : 'clock'} size={20} color={Colors.strongest} />
            </View>
            <View className="flex-1">
              <CustomText size="medium" color="secondary" boldness="bolder" numberOfLines={2}>
                {title}
              </CustomText>
              <CustomText
                size="small"
                color="secondary"
                numberOfLines={2}
                classes="mt-0.5 opacity-80"
              >
                {subtitle}
              </CustomText>
            </View>
            <Feather name="chevron-right" size={20} color={tone} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default DocumentExpiryBanner;

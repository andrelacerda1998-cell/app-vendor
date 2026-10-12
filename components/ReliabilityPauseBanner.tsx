import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/contexts/SessionContext';
import { pausaAte } from '@/utils/fiabilidade';

/**
 * Está sem convites por ter cancelado serviços aceites.
 *
 * Sem isto o técnico ficava Online, sem pedidos, e concluía que a app estava
 * parada — ou que não havia trabalho. Diz-se porquê e até quando, e que volta
 * sozinho: não há nada a fazer senão esperar.
 */
const ReliabilityPauseBanner = () => {
  const { t, i18n } = useTranslation();
  const { vendorData } = useSession();
  const ate = pausaAte(vendorData?.reliability);

  if (!ate) return null;

  const locale = i18n.language === 'pt_PT' ? 'pt-PT' : 'en-GB';
  const quando = ate.toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <View className="px-5">
      <View
        className="flex-row rounded-xl px-4 py-3"
        style={{ backgroundColor: 'rgba(237, 73, 73, 0.14)', borderWidth: 1, borderColor: Colors.danger }}
      >
        <Feather name="pause-circle" size={18} color={Colors.danger} style={{ marginTop: 2 }} />
        <View className="ml-3 flex-1">
          <CustomText color="secondary" boldness="bold" size="small">
            {t('reliability_banner.title', { until: quando })}
          </CustomText>
          <CustomText color="secondary" size="small" classes="mt-0.5">
            {t('reliability_banner.body', { count: vendorData?.reliability?.cancellations_this_month ?? 0 })}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

export default ReliabilityPauseBanner;

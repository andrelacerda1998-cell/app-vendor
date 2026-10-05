import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';

/**
 * Confirmação de que o técnico entrou na lista de candidatos. Honesto de
 * propósito — não diz "serviço aceite", porque o cliente ainda vai escolher.
 * A carga positiva vem da FORMA (check verde grande, próximos passos claros),
 * não de prometer o que não está garantido.
 */
const MatchingAcceptedContent = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();

  const Step = ({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) => (
    <View className="flex-row items-center">
      <View
        className="items-center justify-center rounded-full mr-3"
        style={{ width: 34, height: 34, backgroundColor: Colors.card_high }}
      >
        <Feather name={icon} size={15} color={Colors.brand} />
      </View>
      <CustomText size="small" color="secondary" classes="flex-1" style={{ color: Colors.muted, lineHeight: 19 }}>
        {text}
      </CustomText>
    </View>
  );

  return (
    <View className="w-full p-8">
      <View className="items-center">
        <View
          className="items-center justify-center rounded-full mb-5"
          style={{ width: 76, height: 76, backgroundColor: `${Colors.success}22` }}
        >
          <Feather name="check" size={38} color={Colors.success} />
        </View>
        <CustomText size="title" color="secondary" boldness="bolder" classes="text-center">
          {t('matching.invitation.accepted_title')}
        </CustomText>
        <CustomText
          size="small"
          color="muted"
          classes="text-center mt-2"
          style={{ lineHeight: 20 }}
        >
          {t('matching.invitation.accepted_subtitle')}
        </CustomText>
      </View>

      <View
        className="rounded-2xl mt-6 p-4"
        style={{ backgroundColor: Colors.card, gap: 14 }}
      >
        <Step icon="users" text={t('matching.invitation.accepted_step_choose')} />
        <Step icon="bell" text={t('matching.invitation.accepted_step_notify')} />
        <Step icon="calendar" text={t('matching.invitation.accepted_step_calendar')} />
      </View>

      <CustomTouchableOpacity
        size="large"
        type="support_primary"
        textColor="primary"
        textBoldness="bolder"
        text={t('matching.invitation.accepted_cta')}
        onPress={onClose}
        classes="mt-6"
      />
    </View>
  );
};

export default MatchingAcceptedContent;

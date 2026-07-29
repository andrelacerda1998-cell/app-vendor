import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { Card, IconTile, SectionHeader } from '@/components/ui';

type Shortcut = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  /** Âmbar só para o que exige ação; o resto fica neutro. */
  tone: string;
};

const ShortcutCard = ({ icon, label, onPress, tone }: Shortcut) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="flex-1">
    <Card className="items-center py-5">
      <IconTile size={44} tint={`${tone}1F`}>
        <MaterialIcons name={icon} size={22} color={tone} />
      </IconTile>
      <CustomText size="small" color="secondary" boldness="semiBold" classes="mt-2" numberOfLines={1}>
        {label}
      </CustomText>
    </Card>
  </TouchableOpacity>
);

const HomeShortcuts = () => {
  const { t } = useTranslation();

  return (
    <View className="px-5">
      <SectionHeader title={t('home.shortcuts.title')} />
      <View className="flex-row" style={{ gap: 12 }}>
        {/* A Agenda já tem separador próprio; aqui vale mais o acesso rápido
            à disponibilidade, que não está em mais lado nenhum na Home. */}
        <ShortcutCard
          icon="schedule"
          tone={Colors.brand}
          label={t('profile.activity.availability')}
          onPress={() => router.push('/(app)/(bottom-sheets)/(services)/schedulesSettings')}
        />
        <ShortcutCard
          icon="support-agent"
          tone={Colors.muted}
          label={t('home.shortcuts.support')}
          onPress={() => router.push('/(app)/(pages)/(support)/support')}
        />
      </View>
    </View>
  );
};

export default HomeShortcuts;

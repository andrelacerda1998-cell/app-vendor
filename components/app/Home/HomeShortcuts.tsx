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
};

/**
 * Os atalhos sao pares: dois destinos de navegacao, nenhum urgente. A
 * Disponibilidade estava em ambar e o Suporte em cinzento, o que sugeria uma
 * hierarquia que nao existe — abrir a disponibilidade nao e mais premente do
 * que pedir ajuda. Ficam ambos neutros, e o ambar fica reservado para o que
 * significa mesmo alguma coisa na Home: o dinheiro ganho e o aviso de perfil
 * incompleto.
 */
const TONE = Colors.muted;

const ShortcutCard = ({ icon, label, onPress }: Shortcut) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="flex-1">
    <Card className="items-center py-5">
      <IconTile size={44} tint={`${TONE}1F`}>
        <MaterialIcons name={icon} size={22} color={TONE} />
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
          label={t('profile.activity.availability')}
          onPress={() => router.push('/(app)/(bottom-sheets)/(services)/schedulesSettings')}
        />
        <ShortcutCard
          icon="support-agent"
          label={t('home.shortcuts.support')}
          onPress={() => router.push('/(app)/(pages)/(support)/support')}
        />
      </View>
    </View>
  );
};

export default HomeShortcuts;

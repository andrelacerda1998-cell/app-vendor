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
 * Atalhos: quatro destinos de navegacao, nenhum urgente. Todos neutros — o
 * ambar fica reservado para o que significa mesmo alguma coisa na Home (o
 * dinheiro ganho, o aviso de perfil incompleto).
 *
 * Eram quadrados altos, com o icone empilhado por cima do rotulo: ~110pt de
 * altura cada, 220pt para os quatro. O bloco menos importante do ecra era o
 * mais alto, e empurrava para fora de vista o que interessa. Passam a linhas
 * — icone a esquerda, rotulo ao lado — com metade da altura. Um atalho e um
 * destino, nao um cartao: nao precisa de corpo, precisa de ser tocavel.
 */
const TONE = Colors.muted;

const ShortcutCard = ({ icon, label, onPress }: Shortcut) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="flex-1">
    {/* 56pt de altura: acima do minimo tocavel (44) e metade do que era. */}
    <Card padded={false} className="flex-row items-center px-3" style={{ height: 56 }}>
      <IconTile size={32} tint={`${TONE}1F`}>
        <MaterialIcons name={icon} size={18} color={TONE} />
      </IconTile>
      <CustomText
        size="small"
        color="secondary"
        boldness="semiBold"
        classes="ml-2.5 flex-1"
        numberOfLines={1}
      >
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
      {/* Dois pares. Todos estes ecrãs viviam enterrados no Perfil e todos
          respondem a uma pergunta que se faz na Home: quando trabalho, quanto
          cobro, o que dizem de mim, e com quem falo quando algo corre mal. */}
      <View style={{ gap: 10 }}>
        <View className="flex-row" style={{ gap: 10 }}>
          {/* A Agenda já tem separador próprio; aqui vale mais o acesso rápido
              à disponibilidade, que não está em mais lado nenhum na Home. */}
          <ShortcutCard
            icon="schedule"
            label={t('profile.activity.availability')}
            onPress={() => router.push('/(app)/(bottom-sheets)/(services)/schedulesSettings')}
          />
          <ShortcutCard
            icon="euro"
            label={t('hourly_rate.title')}
            onPress={() => router.push('/(app)/(pages)/(hourly-rate)/hourly-rate')}
          />
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          <ShortcutCard
            icon="star-outline"
            label={t('profile.activity.reviews')}
            onPress={() => router.push('/(app)/(pages)/(reviews)/reviews')}
          />
          <ShortcutCard
            icon="support-agent"
            label={t('home.shortcuts.support')}
            onPress={() => router.push('/(app)/(pages)/(support)/support')}
          />
        </View>
      </View>
    </View>
  );
};

export default HomeShortcuts;

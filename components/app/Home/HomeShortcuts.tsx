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

  /**
   * Seis destinos, em pares: os tres primeiros governam o trabalho que lhe
   * chega (quando, o que, por quanto), os tres ultimos a conta em ordem, a
   * reputacao e a ajuda. Todos viviam enterrados no separador Perfil.
   *
   * Ficaram de fora o Historico e as Faltas. O historico de servicos e
   * retrospetivo e o separador Ganhos ja mostra o que foi feito e o que ha
   * a receber; as faltas sao raras e estao a zero para quase toda a gente —
   * ambos continuam no Perfil, que e onde se vai procurar o que nao se usa
   * todos os dias. Um atalho que nunca se toca rouba atencao aos outros.
   *
   * "Os meus servicos" volta a estar a mao: era o cartao de categorias que
   * saiu da Home por ocupar um lugar nobre sem o merecer — como atalho fica
   * disponivel sem custar meio ecra.
   */
  const shortcuts: Shortcut[] = [
    {
      icon: 'schedule',
      label: t('profile.activity.availability'),
      onPress: () => router.push('/(app)/(bottom-sheets)/(services)/schedulesSettings'),
    },
    {
      icon: 'handyman',
      label: t('profile.my_profile.labels.my_services'),
      onPress: () => router.push('/(app)/(bottom-sheets)/areas'),
    },
    {
      icon: 'euro',
      label: t('hourly_rate.title'),
      onPress: () => router.push('/(app)/(pages)/(hourly-rate)/hourly-rate'),
    },
    {
      icon: 'description',
      label: t('profile.activity.documents'),
      onPress: () => router.push('/(app)/(pages)/(mydocuments)/mydocuments'),
    },
    {
      icon: 'star-outline',
      label: t('profile.activity.reviews'),
      onPress: () => router.push('/(app)/(pages)/(reviews)/reviews'),
    },
    {
      icon: 'support-agent',
      label: t('home.shortcuts.support'),
      onPress: () => router.push('/(app)/(pages)/(support)/support'),
    },
  ];

  // Em pares, para a grelha de duas colunas.
  const rows = shortcuts.reduce<Shortcut[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item]);
    else acc[acc.length - 1].push(item);
    return acc;
  }, []);

  return (
    <View className="px-5">
      <SectionHeader title={t('home.shortcuts.title')} />
      <View style={{ gap: 10 }}>
        {rows.map((row, i) => (
          <View key={i} className="flex-row" style={{ gap: 10 }}>
            {row.map((item) => <ShortcutCard key={item.label} {...item} />)}
            {/* Linha impar: o espaco do par em falta fica vazio, para o
                ultimo atalho nao esticar para o dobro da largura. */}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </View>
    </View>
  );
};

export default HomeShortcuts;

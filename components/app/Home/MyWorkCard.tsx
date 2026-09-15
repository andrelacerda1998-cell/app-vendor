import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { Card, SectionHeader } from '@/components/ui';
import { useService } from '@/contexts/ServiceContext';

/**
 * "O que fazes" — categorias e tipos de serviço subscritos.
 *
 * A Home já ia buscar isto (`getOperationAreas`) no arranque e não o mostrava
 * em lado nenhum. Num dia sem trabalho o ecrã ficava com a agenda vazia, três
 * zeros e dois atalhos — nada que explicasse porque não chegam pedidos. Isto
 * responde a essa pergunta com o que o técnico escolheu.
 *
 * Nota de nomenclatura: `operation_areas` são CATEGORIAS (Canalização,
 * Eletricidade…), não zonas geográficas. As traduções antigas `home.my_areas*`
 * diziam "zonas" e falavam de "onde trabalhas" — ficavam por usar, e ainda
 * bem: descreviam outra coisa. Não se tocou nelas para não partir quem lhes
 * pegue; este cartão tem chaves próprias.
 */
const MyWorkCard = () => {
  const { t } = useTranslation();
  const { myOperationAreas } = useService();

  // `null` = ainda a carregar. Um "não tens zonas" durante o carregamento
  // seria uma acusação falsa, por isso não se mostra nada.
  if (myOperationAreas === null) return null;

  const areas = myOperationAreas;
  const servicesCount = areas.reduce(
    (sum, area) => sum + (area.services_types_subscribed?.length ?? 0),
    0
  );
  const goToAreas = () => router.push('/(app)/(bottom-sheets)/areas');

  return (
    <View className="px-5">
      <SectionHeader
        title={t('home.my_work.title')}
        action={areas.length > 0 ? t('home.my_work.change') : undefined}
        onAction={areas.length > 0 ? goToAreas : undefined}
      />

      {areas.length === 0 ? (
        <TouchableOpacity activeOpacity={0.85} onPress={goToAreas}>
          <Card className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: Colors.brand_soft }}
            >
              <Feather name="tool" size={22} color={Colors.brand} />
            </View>
            <CustomText color="secondary" size="small" classes="flex-1 ml-3.5" numberOfLines={3}>
              {t('home.my_work.empty')}
            </CustomText>
            <Feather name="chevron-right" size={20} color={Colors.muted} />
          </Card>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={goToAreas}>
          <Card>
            {/* As categorias em pastilhas: de relance vê-se para que trabalho
                é convidável, sem ter de abrir outro ecrã. */}
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {areas.map((area) => (
                <View
                  key={area.id}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: Colors.brand_soft }}
                >
                  <CustomText size="extraSmall" boldness="bold" color="secondary" numberOfLines={1}>
                    {area.name}
                  </CustomText>
                </View>
              ))}
            </View>
            <View
              className="flex-row items-center mt-3.5 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: Colors.line }}
            >
              <Feather name="tool" size={14} color={Colors.muted} />
              <CustomText color="muted" size="small" classes="ml-2 flex-1" numberOfLines={2}>
                {t('home.my_work.services', { count: servicesCount })}
              </CustomText>
              <Feather name="chevron-right" size={18} color={Colors.muted} />
            </View>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MyWorkCard;

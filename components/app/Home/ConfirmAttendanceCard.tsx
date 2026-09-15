import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useSchedule } from '@/contexts/ScheduleContext';
import { needsAttendanceConfirmation } from '@/utils/attendance';

/**
 * "Confirma que vais" — aviso na Home dos servicos por confirmar.
 *
 * O botao de confirmar vive na Agenda, num separador que o tecnico pode
 * passar dias sem abrir: o pedido de confirmacao nao chegava a lado nenhum
 * que ele veja ao abrir a app. Quando a confirmacao nao chega, o cliente fica
 * em casa a espera — e a operacao so descobre tarde demais.
 *
 * Nao repete a agenda: diz quantos faltam e leva ao sitio onde se confirma.
 * A hora do proximo saiu — quem quer saber qual e esta a um toque, na
 * Agenda, e a linha so afastava o titulo do botao.
 *
 * Verde, como o proprio botao e como o visto de confirmado: e a familia da
 * confirmacao. O ambar fica para o que corre mal.
 */
const ConfirmAttendanceCard = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();

  // So o numero interessa: o cartao deixou de dizer qual e o proximo, por
  // isso nao ha nada a ordenar.
  const porConfirmar = (scheduledServicesData ?? []).filter(needsAttendanceConfirmation);

  if (porConfirmar.length === 0) return null;

  return (
    <View className="px-5">
      {/* Facto e um botao a dizer o que fazer. A seta sozinha obrigava a
          adivinhar que o cartao levava a algum lado — e o titulo dava uma
          ordem ("confirma") sem mostrar onde se confirma. */}
      <View
        className="rounded-2xl border p-3.5"
        style={{ backgroundColor: 'rgba(35,230,158,0.10)', borderColor: 'rgba(35,230,158,0.40)' }}
      >
        {/* Tudo centrado, no mesmo eixo do botao. O visto vem na linha do
            titulo, e nao num circulo por cima: empilhado, gastava uma linha
            inteira para repetir o que a cor verde do cartao ja diz. */}
        <View className="flex-row items-center justify-center">
          <Feather name="check-circle" size={16} color={Colors.success} style={{ marginRight: 7 }} />
          <CustomText color="secondary" boldness="bold" size="small" classes="text-center" numberOfLines={1}>
            {t('schedules.attendance_nudge_title', { count: porConfirmar.length })}
          </CustomText>
        </View>

        {/* Abre a Agenda, onde cada servico tem o seu botao: com mais do que
            um por confirmar, um toque nao pode decidir por todos. */}
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          onPress={() => router.navigate('/(app)/(tabs)/wallet')}
          className="items-center rounded-xl mt-3 py-2"
          style={{ backgroundColor: Colors.success }}
        >
          <CustomText color="strongest" boldness="bold" size="small">
            {t('schedules.confirm_attendance')}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ConfirmAttendanceCard;

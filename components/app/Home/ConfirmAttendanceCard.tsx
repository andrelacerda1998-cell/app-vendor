import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useSchedule } from '@/contexts/ScheduleContext';
import { needsAttendanceConfirmation, scheduleStartsAt } from '@/utils/attendance';

const hhmm = (t?: string) => (t ? String(t).slice(0, 5) : '');

/**
 * "Confirma que vais" — aviso na Home dos servicos por confirmar.
 *
 * O botao de confirmar vive na Agenda, num separador que o tecnico pode
 * passar dias sem abrir: o pedido de confirmacao nao chegava a lado nenhum
 * que ele veja ao abrir a app. Quando a confirmacao nao chega, o cliente fica
 * em casa a espera — e a operacao so descobre tarde demais.
 *
 * Nao repete a agenda: conta quantos faltam e diz quando e o mais proximo.
 * Toca-se e abre a Agenda, onde esta o botao.
 *
 * A legenda e so a hora. O "o cliente fica a espera se nao apareceres" que
 * aqui esteve explicava o porque a quem ja esta a ler um pedido para
 * confirmar — duas linhas de texto para uma informacao de quatro palavras.
 *
 * Verde, como o proprio botao e como o visto de confirmado: e a familia da
 * confirmacao. O ambar fica para o que corre mal.
 */
const ConfirmAttendanceCard = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();

  const porConfirmar = (scheduledServicesData ?? [])
    .filter(needsAttendanceConfirmation)
    .sort((a, b) => (scheduleStartsAt(a) ?? 0) - (scheduleStartsAt(b) ?? 0));

  if (porConfirmar.length === 0) return null;

  const proximo = porConfirmar[0];
  const hora = hhmm(proximo?.schedule?.scheduled_time?.start);
  const rotulo = proximo?.schedule?.date_label;

  /**
   * "Hoje as 16:00" sozinho nao se percebia: com o titulo a falar de tres
   * servicos e a legenda a dar uma hora, tanto podia ser o inicio do proximo
   * como o prazo para confirmar. A legenda passa a dizer o que aquela hora e.
   *
   * Com um unico servico por confirmar, "o mais proximo" nao existe — nao ha
   * com o que comparar. O sufixo dessa variante e `_single` e nao `_one` de
   * proposito: `_one` e uma forma plural do i18next e seria apanhada se
   * alguem passasse um `count` a chave base.
   */
  const varios = porConfirmar.length > 1;
  const quando = rotulo === 'today'
    ? t(varios ? 'schedules.attendance_nudge_today' : 'schedules.attendance_nudge_today_single', { time: hora })
    : rotulo === 'tomorrow'
      ? t(varios ? 'schedules.attendance_nudge_tomorrow' : 'schedules.attendance_nudge_tomorrow_single', { time: hora })
      : null;

  return (
    <View className="px-5">
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        onPress={() => router.navigate('/(app)/(tabs)/wallet')}
        className="flex-row items-center rounded-2xl border p-4"
        style={{ backgroundColor: 'rgba(35,230,158,0.10)', borderColor: 'rgba(35,230,158,0.40)' }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: Colors.success }}
        >
          <Feather name="check" size={20} color={Colors.strongest} />
        </View>
        <View className="flex-1 pr-2">
          <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
            {t('schedules.attendance_nudge_title', { count: porConfirmar.length })}
          </CustomText>
          <CustomText color="muted" size="small" classes="mt-0.5" numberOfLines={1}>
            {quando ?? t('schedules.attendance_nudge_subtitle')}
          </CustomText>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.success} />
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmAttendanceCard;

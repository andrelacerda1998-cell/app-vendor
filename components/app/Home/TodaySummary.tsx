import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { Card, IconTile } from '@/components/ui';
import { useSchedule } from '@/contexts/ScheduleContext';
import { renderMoney } from '@/utils/money';
import { schedulesSection } from '@/components/app/Home/Schedules';

/**
 * "Hoje" — resumo do dia (paridade com `_todaySummary` do build 12 Flutter).
 *
 * Reutiliza os serviços agendados que o ScheduleContext JÁ carrega
 * (`scheduledServicesData`) — sem endpoint novo. Mostra quantos serviços há
 * hoje, quanto dá para ganhar e a hora da próxima paragem.
 *
 * Sem serviços hoje o cartão não é renderizado de todo: a Home não ganha nada
 * com um estado vazio a ocupar espaço.
 */
const TodaySummary = () => {
  const { t } = useTranslation();
  const { scheduledServicesData } = useSchedule();

  const { jobs, total, nextStart } = useMemo(() => {
    const list = (scheduledServicesData ?? []).filter(
      (s) => s?.schedule?.date_label === 'today',
    );

    // Só somamos o que o backend deu: nada de estimar valores em falta.
    const sum = list.reduce(
      (acc, s) => acc + (typeof s.amount_for_vendor === 'number' ? s.amount_for_vendor : 0),
      0,
    );

    // Próxima paragem = a hora de início mais cedo ainda por acontecer;
    // se já passaram todas, mostra a mais cedo do dia.
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const starts = list
      .map((s) => (s.schedule?.scheduled_time?.start ?? '').slice(0, 5))
      .filter((h) => /^\d{2}:\d{2}$/.test(h))
      .sort();
    const upcoming = starts.find((h) => {
      const [hh, mm] = h.split(':').map(Number);
      return hh * 60 + mm >= nowMinutes;
    });

    return { jobs: list, total: sum, nextStart: upcoming ?? starts[0] ?? null };
  }, [scheduledServicesData]);

  if (jobs.length === 0) return null;

  const money = total > 0 ? renderMoney(total) : null;
  const countLabel = `${jobs.length} ${jobs.length === 1 ? t('home_today.service') : t('home_today.services')}`;

  return (
    <View className="px-5">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push(`/(app)/(bottom-sheets)/(services)/schedules/${schedulesSection.today}`)
        }
      >
        <Card>
          <View className="flex-row items-center">
            <IconTile>
              <Feather name="sun" size={18} color={Colors.brand} />
            </IconTile>
            <View className="flex-1 ml-3">
              <CustomText color="muted" size="extraSmall" boldness="bold">
                {t('home_today.title')}
              </CustomText>
              <CustomText color="secondary" size="medium" boldness="bold" numberOfLines={1} classes="mt-0.5">
                {money ? t('home_today.summary', { label: countLabel, amount: money }) : countLabel}
              </CustomText>
            </View>
            <Feather name="chevron-right" size={22} color={Colors.muted} />
          </View>

          {nextStart ? (
            <View
              className="flex-row items-center mt-3 pt-3 border-t"
              style={{ borderTopColor: Colors.line }}
            >
              <Feather name="clock" size={14} color={Colors.muted} />
              <CustomText color="muted" size="small" boldness="regular" classes="ml-2">
                {t('home_today.next_stop', { time: nextStart })}
              </CustomText>
            </View>
          ) : null}
        </Card>
      </TouchableOpacity>
    </View>
  );
};

export default TodaySummary;

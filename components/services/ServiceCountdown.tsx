import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';

/**
 * Quanto falta para o fim do tempo estimado do serviço.
 *
 * O técnico sabia a duração estimada ("~45 min") mas não quanto já tinha
 * passado — tinha de fazer a conta de cabeça a partir da hora a que chegou.
 * Aqui conta sozinho, e quando o tempo estimado é ultrapassado passa a contar
 * o excesso, sem alarme: exceder é normal e não é falta nenhuma. O que importa
 * é ele saber, para poder pedir tempo extra ou avisar o cliente seguinte.
 *
 * `startedAt` é o `arrived_at` do serviço (início da execução). Sem ele — ou
 * sem duração no catálogo — não se mostra nada: um contador a partir de um
 * palpite seria pior do que contador nenhum.
 */
const ServiceCountdown = ({
  startedAt,
  estimatedMinutes,
}: {
  startedAt?: string | null;
  estimatedMinutes?: number | null;
}) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  const start = startedAt ? new Date(startedAt).getTime() : NaN;
  const minutes = Number(estimatedMinutes);
  const valid = Number.isFinite(start) && Number.isFinite(minutes) && minutes > 0;

  // 15s chega para um contador em minutos e é barato; 1s só faria o telemóvel
  // trabalhar para mostrar o mesmo número.
  useEffect(() => {
    if (!valid) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [valid]);

  if (!valid) return null;

  const endsAt = start + minutes * 60000;
  const diffMs = endsAt - now;
  const over = diffMs < 0;
  const totalMin = Math.max(0, Math.round(Math.abs(diffMs) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const value = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;

  // Últimos 10 minutos: âmbar, para dar tempo de reagir antes de exceder.
  const soon = !over && diffMs <= 10 * 60000;
  const color = over ? Colors.warning : soon ? Colors.brand : Colors.success;

  return (
    <View
      className="flex-row items-center rounded-xl px-3 py-2.5 mt-3"
      style={{ backgroundColor: `${color}1A` }}
    >
      <Feather name={over ? 'alert-circle' : 'clock'} size={15} color={color} />
      <CustomText size="small" color="secondary" classes="ml-2 flex-1" numberOfLines={1}>
        {over ? t('services.service.status.countdown.over') : t('services.service.status.countdown.left')}
      </CustomText>
      <CustomText size="small" boldness="bolder" color="secondary" style={{ color }}>
        {value}
      </CustomText>
    </View>
  );
};

export default ServiceCountdown;

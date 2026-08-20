import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { cardShadow } from '@/components/ui';

/**
 * Quanto falta para o fim do tempo estimado — o elemento DOMINANTE enquanto o
 * serviço decorre.
 *
 * Com o serviço a decorrer, a pergunta do técnico é uma só: "quanto tempo
 * tenho ainda?". Estava numa barra pequena por baixo do stepper e perdia-se
 * entre o resto; passa a cartão próprio, com o número grande e uma barra de
 * progresso, acima de tudo o resto.
 *
 * Exceder o tempo é normal e NÃO é falta: por isso o estado de excesso muda de
 * cor e de texto, mas não usa vermelho de erro. O que importa é ele saber, para
 * poder pedir tempo extra ou avisar o cliente seguinte.
 *
 * `startedAt` é o `arrived_at` (início da execução). Sem ele — ou sem duração
 * no catálogo — não se mostra nada: contar a partir de um palpite seria pior
 * do que não contar.
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

  const totalMs = minutes * 60000;
  const elapsedMs = Math.max(0, now - start);
  const diffMs = totalMs - elapsedMs;
  const over = diffMs < 0;

  const totalMin = Math.max(0, Math.round(Math.abs(diffMs) / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const value = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : String(m);
  const unit = h > 0 ? '' : 'min';

  // Últimos 10 minutos: âmbar, para dar tempo de reagir antes de exceder.
  const soon = !over && diffMs <= 10 * 60000;
  const color = over ? Colors.warning : soon ? Colors.brand : Colors.success;
  const progress = Math.min(1, elapsedMs / totalMs);

  return (
    <View
      className="rounded-2xl border p-4 mt-3"
      style={[{ backgroundColor: `${color}14`, borderColor: `${color}66` }, cardShadow]}
    >
      <View className="flex-row items-center">
        <Feather name={over ? 'alert-circle' : 'clock'} size={14} color={color} />
        <CustomText
          size="extraSmall"
          boldness="bold"
          color="secondary"
          classes="ml-2"
          style={{ color, letterSpacing: 1 }}
        >
          {(over
            ? t('services.service.status.countdown.over')
            : t('services.service.status.countdown.left')
          ).toUpperCase()}
        </CustomText>
      </View>

      {/* O número é o herói: é a resposta à única pergunta que ele tem agora. */}
      <View className="flex-row items-baseline mt-1.5">
        <CustomText size="headline" boldness="bolder" color="secondary" style={{ color }}>
          {value}
        </CustomText>
        {!!unit && (
          <CustomText size="medium" boldness="bold" color="secondary" classes="ml-1.5" style={{ color }}>
            {unit}
          </CustomText>
        )}
      </View>

      {/* Barra: mostra de relance a parte do tempo já gasta. */}
      <View
        className="rounded-full overflow-hidden mt-3"
        style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.10)' }}
      >
        <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: color }} />
      </View>

      <CustomText size="extraSmall" color="muted" classes="mt-2" numberOfLines={1}>
        {t('services.service.status.countdown.of_estimate', { value: minutes })}
      </CustomText>
    </View>
  );
};

export default ServiceCountdown;

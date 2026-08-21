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

  // Calculado antes do efeito porque decide a cadência do tick (ver abaixo).
  // Segundos só abaixo de uma hora — acima disso não acrescentam nada.
  const absDiffMs = valid ? Math.abs(minutes * 60000 - Math.max(0, now - start)) : 0;
  const showsSeconds = absDiffMs < 3600000;

  /**
   * Ao segundo enquanto há segundos à vista (abaixo de 1h); de 30 em 30 acima
   * disso, onde só mudam as horas e os minutos. Um intervalo maior no primeiro
   * caso fazia o contador saltar e parecer avariado; ao segundo no segundo
   * caso seria trabalho para não mostrar diferença nenhuma.
   * Só este componente volta a desenhar-se — o estado é local.
   */
  useEffect(() => {
    if (!valid) return;
    const id = setInterval(() => setNow(Date.now()), showsSeconds ? 1000 : 30000);
    return () => clearInterval(id);
  }, [valid, showsSeconds]);

  if (!valid) return null;

  const totalMs = minutes * 60000;
  const elapsedMs = Math.max(0, now - start);
  const diffMs = totalMs - elapsedMs;
  const over = diffMs < 0;

  // Segundos INTEIROS por defeito (floor), não arredondados: com arredondamento
  // o contador começava em 45:00 e saltava logo para 44:59 — parecia perder um
  // segundo de imediato.
  const totalSec = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  /**
   * Os segundos só aparecem abaixo de uma hora.
   *
   * "19:24" por baixo de "TEMPO RESTANTE" lê-se como duração e os segundos a
   * correr dão a noção do tempo a escoar. Mas num serviço esquecido — vimos um
   * com 16 horas de excesso — "15:58:22" é um número enorme onde os segundos
   * não dizem nada a ninguém. A partir de uma hora mostra-se "16h" e "1h05".
   */
  const value = h > 0
    ? (m > 0 ? `${h}h${pad(m)}` : `${h}h`)
    : `${m}:${pad(sec)}`;

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

      {/* O número é o herói: é a resposta à única pergunta que ele tem agora.
          `tabular-nums` fixa a largura dos dígitos — sem isso o texto dança
          da esquerda para a direita a cada segundo, porque o "1" é mais
          estreito que os outros algarismos. */}
      <View className="flex-row items-baseline mt-1.5">
        <CustomText
          size="headline"
          boldness="bolder"
          color="secondary"
          style={{ color, fontVariant: ['tabular-nums'] }}
        >
          {value}
        </CustomText>
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

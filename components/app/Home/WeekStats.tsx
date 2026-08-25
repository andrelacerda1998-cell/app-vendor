import React, { useEffect, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { renderMoney } from '@/utils/money'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { useSession } from '@/contexts/SessionContext'
import { Feather as FeatherIcon } from '@expo/vector-icons'

interface Stats {
  this_week_earnings: number;
  this_week_services: number;
  total_services: number;
  rating: number | null;
}

const StatItem = ({
  value,
  label,
  star,
  highlight,
  empty,
}: { value: string; label: string; star?: boolean; highlight?: boolean; empty?: boolean }) => (
  <View className="flex-1 items-center">
    <View className="flex-row items-center justify-center">
      {/* O dinheiro ganho é a razão pela qual o técnico abre a app: é o único
          número em âmbar. Os outros ficam em branco para não competirem.
          Mas só quando há dinheiro: a cor da marca num 0,00 € celebra o nada
          e, de tanto aparecer, deixa de significar seja o que for. Mesma regra
          da estrela aqui em baixo. */}
      <CustomText
        size={highlight ? 'extraLarge' : 'large'}
        color={highlight && !empty ? 'brand' : 'secondary'}
        boldness="bolder"
        numberOfLines={1}
      >
        {value}
      </CustomText>
      {/* Estrela só ganha cor quando há avaliação a sério. */}
      {star && (
        <Feather
          name="star"
          size={14}
          color={value === '—' ? Colors.muted : Colors.brand}
          style={{ marginLeft: 3 }}
        />
      )}
    </View>
    <CustomText size="extraSmall" color="muted" boldness="regular" classes="mt-1" numberOfLines={1}>{label}</CustomText>
  </View>
)

const Divider = () => <View style={{ width: 1, height: 32, backgroundColor: Colors.line }} />

const WeekStats = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData, vendorStatus } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const isOnline = vendorStatus === 'Online';

  useEffect(() => {
    let mounted = true;
    api.get(API_ROUTES.VENDOR_GET_STATS)
      .then((res: any) => { if (mounted) setStats(res?.data?.data ?? null); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const earnings = renderMoney(stats?.this_week_earnings ?? 0) || '0,00 €';
  const services = String(stats?.this_week_services ?? 0);
  const rating = stats?.rating != null ? stats.rating.toFixed(1) : '—';

  /**
   * Semana a zero num técnico já aprovado.
   *
   * Três zeros na cara — 0,00 € · 0 serviços · — de avaliação — sem dizer
   * porquê, lê-se como "isto não funciona". Quem está pronto e sem trabalho
   * precisa de contexto, não de um boletim de notas vazio. A procura na zona
   * (zone_recent_requests) diz-lhe que há mercado; o resto é a app explicar
   * o que falta do lado dele.
   */
  const approved = !!vendorData?.can_accept_service;
  const emptyWeek = !stats?.this_week_earnings && !stats?.this_week_services;
  const zoneRequests = vendorData?.zone_recent_requests ?? 0;
  const explain = approved && emptyWeek;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      // rota "history" = separador Ganhos (nome legado)
      onPress={() => router.push('/(app)/(tabs)/history')}
    >
      <Card padded={false} style={{ paddingVertical: 18 }}>
      <View className="flex-row items-center">
      <StatItem
        value={earnings}
        label={t('home_stats.this_week')}
        highlight
        empty={!(stats?.this_week_earnings)}
      />
      <Divider />
      <StatItem
        value={services}
        label={stats?.this_week_services === 1 ? t('home_stats.service') : t('home_stats.services')}
      />
      <Divider />
      <StatItem value={rating} label={t('home_stats.rating')} star />
      </View>

      {explain && (
        <View
          className="flex-row items-center mx-4 mt-4 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: Colors.line }}
        >
          <FeatherIcon name="info" size={14} color={Colors.muted} />
          <CustomText color="muted" size="small" classes="ml-2 flex-1" numberOfLines={3}>
            {/* "Fica online" só a quem está offline. O texto era incondicional
                e mandava ficar online quem já estava — uma instrução que não
                faz sentido faz duvidar de tudo o resto que a app diz. */}
            {isOnline
              ? (zoneRequests > 0
                  ? t('home_stats.empty_with_demand_online', { count: zoneRequests })
                  : t('home_stats.empty_ready_online'))
              : (zoneRequests > 0
                  ? t('home_stats.empty_with_demand', { count: zoneRequests })
                  : t('home_stats.empty_ready'))}
          </CustomText>
        </View>
      )}
      </Card>
    </TouchableOpacity>
  )
}

export default WeekStats

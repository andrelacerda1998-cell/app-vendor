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
}: { value: string; label: string; star?: boolean; highlight?: boolean }) => (
  <View className="flex-1 items-center">
    <View className="flex-row items-center justify-center">
      {/* O dinheiro ganho é a razão pela qual o técnico abre a app: é o único
          número em âmbar. Os outros ficam em branco para não competirem. */}
      <CustomText
        size={highlight ? 'extraLarge' : 'large'}
        color={highlight ? 'brand' : 'secondary'}
        boldness="bolder"
        numberOfLines={1}
      >
        {value}
      </CustomText>
      {star && <Feather name="star" size={14} color={Colors.brand} style={{ marginLeft: 3 }} />}
    </View>
    <CustomText size="extraSmall" color="muted" boldness="regular" classes="mt-1" numberOfLines={1}>{label}</CustomText>
  </View>
)

const Divider = () => <View style={{ width: 1, height: 32, backgroundColor: Colors.line }} />

const WeekStats = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);

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

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      // rota "history" = separador Ganhos (nome legado)
      onPress={() => router.push('/(app)/(tabs)/history')}
    >
      <Card className="flex-row items-center" padded={false} style={{ paddingVertical: 18 }}>
      <StatItem value={earnings} label={t('home_stats.this_week')} highlight />
      <Divider />
      <StatItem
        value={services}
        label={stats?.this_week_services === 1 ? t('home_stats.service') : t('home_stats.services')}
      />
      <Divider />
      <StatItem value={rating} label={t('home_stats.rating')} star />
      </Card>
    </TouchableOpacity>
  )
}

export default WeekStats

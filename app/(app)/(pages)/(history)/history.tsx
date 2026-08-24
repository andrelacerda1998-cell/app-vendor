/**
 * HISTÓRICO — serviços concluídos, cancelados e oportunidades perdidas.
 */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { renderMoney } from '@/utils/money';
import { Card, IconTile, EmptyState, HeroCard, ErrorState, SkeletonList, SkeletonBlock } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';

type FilterKey = 'all' | 'completed' | 'cancelled' | 'lost';
const FILTERS: FilterKey[] = ['all', 'completed', 'cancelled', 'lost'];

interface Totals {
  completed_count: number;
  completed_amount: number;
  cancelled_count: number;
  lost_count: number;
  lost_amount: number;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const History = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [filter, setFilter] = useState<FilterKey>('completed');
  const [services, setServices] = useState<any[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isOnline = useIsOnline();

  const load = async (f: FilterKey = filter) => {
    const { data } = await api.post(API_ROUTES.POST_SERVICES_HISTORY, { filter: f, offset: 0 });
    setServices(data?.data?.services ?? []);
    setTotals(data?.data?.totals ?? null);
  };

  useFocusEffect(useCallback(() => {
    let alive = true;
    setLoading(true);
    load(filter)
      .then(() => { if (alive) setFailed(false); })
      .catch(() => { if (alive) { setFailed(true); setServices([]); setTotals(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filter]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(filter); setFailed(false); } catch { setFailed(true); } finally { setRefreshing(false); }
  };

  const retry = async () => {
    setLoading(true);
    try { await load(filter); setFailed(false); } catch { setFailed(true); } finally { setLoading(false); }
  };

  const isLost = filter === 'lost';

  const emptyFor: Record<FilterKey, { title: string; subtitle: string; icon: any }> = {
    all: { title: t('history.empty.all_title'), subtitle: t('history.empty.all'), icon: 'inbox' },
    completed: { title: t('history.empty.completed_title'), subtitle: t('history.empty.completed'), icon: 'check-circle' },
    cancelled: { title: t('history.empty.cancelled_title'), subtitle: t('history.empty.cancelled'), icon: 'x-circle' },
    lost: { title: t('history.empty.lost_title'), subtitle: t('history.empty.lost'), icon: 'clock' },
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('history.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      {/* Filtros */}
      <View className="px-5 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row" style={{ gap: 8 }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  activeOpacity={0.8}
                  onPress={() => setFilter(f)}
                  className="rounded-full px-4 py-2 border"
                  style={{
                    borderColor: active ? Colors.brand : Colors.line,
                    backgroundColor: active ? 'rgba(250,187,91,0.14)' : Colors.card,
                  }}
                >
                  <CustomText
                    size="small"
                    color={active ? 'brand' : 'muted'}
                    boldness={active ? 'bold' : 'regular'}
                  >
                    {t(`history.filters.${f}`)}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* Resumo — escondido enquanto carrega/falha, para não mostrar 0,00 € falso */}
        {!loading && !failed && !!totals && (
          isLost ? (
            <View
              className="rounded-2xl border p-4 mb-4"
              style={{ backgroundColor: 'rgba(255,90,95,0.08)', borderColor: 'rgba(255,90,95,0.25)' }}
            >
              <CustomText size="small" color="muted">
                {t('history.lost_summary', { count: totals.lost_count })}
              </CustomText>
              <CustomText size="large" color="danger" boldness="bolder" classes="mt-0.5">
                −{renderMoney(totals.lost_amount) || '0,00 €'}
              </CustomText>
              <CustomText size="extraSmall" color="muted" classes="mt-1">
                {t('history.lost_hint')}
              </CustomText>
            </View>
          ) : (
            <HeroCard style={{ marginBottom: 16 }}>
              <CustomText size="small" color="muted">
                {t('history.earned_summary', { count: totals.completed_count })}
              </CustomText>
              <CustomText size="subtitle" color="secondary" boldness="bolder" classes="mt-0.5">
                {renderMoney(totals.completed_amount) || '0,00 €'}
              </CustomText>
            </HeroCard>
          )
        )}

        {loading ? (
          <>
            <Card className="mb-4">
              <SkeletonBlock width="50%" height={12} />
              <SkeletonBlock width="35%" height={24} style={{ marginTop: 10 }} />
            </Card>
            <SkeletonList rows={4} />
          </>
        ) : failed ? (
          <ErrorState
            icon={isOnline ? 'alert-circle' : 'wifi-off'}
            title={t('history.error_title')}
            subtitle={isOnline ? t('history.error_subtitle') : t('general.offline_subtitle')}
            onRetry={retry}
          />
        ) : services.length === 0 ? (
          <EmptyState
            icon={emptyFor[filter].icon}
            title={emptyFor[filter].title}
            subtitle={emptyFor[filter].subtitle}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {services.map((s: any) => {
              const cancelled = s?.status === 'Canceled';
              const lost = s?.status === 'Refused';
              const ui = lost
                ? { color: Colors.muted, icon: 'clock' as const, tint: 'rgba(154,154,161,0.14)' }
                : cancelled
                ? { color: Colors.danger, icon: 'x' as const, tint: 'rgba(255,90,95,0.14)' }
                : { color: Colors.success, icon: 'check' as const, tint: 'rgba(35,230,158,0.14)' };

              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(app)/(services)/history/${s.id}`)}
                >
                  <Card className="flex-row items-center">
                    <IconTile size={40} tint={ui.tint}>
                      <Feather name={ui.icon} size={18} color={ui.color} />
                    </IconTile>
                    <View className="flex-1 ml-3">
                      <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1}>
                        {s?.service_type?.name ?? '—'}
                      </CustomText>
                      <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={1}>
                        {[s?.customer?.name, fmtDate(s?.created_at)].filter(Boolean).join(' · ')}
                      </CustomText>
                    </View>
                    <CustomText
                      color={lost || cancelled ? 'muted' : 'secondary'}
                      boldness="bolder"
                      size="medium"
                    >
                      {renderMoney(s?.amount_for_vendor ?? null) || '—'}
                    </CustomText>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;

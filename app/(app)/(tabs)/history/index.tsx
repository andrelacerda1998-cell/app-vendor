/**
 * GANHOS — semana atual, últimas 4 semanas, próximo pagamento e serviços da semana.
 * (Rota "history" por legado; o separador é Ganhos.)
 */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { renderMoney } from '@/utils/money';
import { Card, HeroCard, IconTile, EmptyState, ErrorState, SkeletonBlock, SkeletonList } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';

interface WeekRow { week_start: string; week_end: string; earnings: number; services: number }
interface CompletedRow { id: number; service_type: string | null; amount_for_vendor: number; completed_at: string | null }
interface Stats {
  this_week_earnings: number;
  this_week_services: number;
  total_paid: number;
  total_earned?: number;
  total_transferred?: number;
  pending_payment_amount?: number;
  pending_payment_count?: number;
  last_weeks: WeekRow[];
  last_4_weeks_earnings: number;
  next_payment_date: string;
  completed_this_week: CompletedRow[];
}

const shortDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};

const longDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', weekday: 'long' });
};

/** PT50 0000 0000 0000 0000 0000 0 → "PT5000 •••• 0154" */
const maskIban = (iban?: string | null) => {
  if (!iban) return null;
  const clean = String(iban).replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 6)} •••• ${clean.slice(-4)}`;
};

const Earnings = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData } = useSession();
  const isOnline = useIsOnline();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // `loading` só é verdade enquanto ainda não há números: sem isto o ecrã
  // mostrava "0,00 €" durante o carregamento, indistinguível de um ganho real.
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    const r = await api.get(API_ROUTES.VENDOR_GET_STATS);
    setStats(r?.data?.data ?? null);
  };

  useFocusEffect(useCallback(() => {
    let alive = true;
    load()
      .then(() => { if (alive) setFailed(false); })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setRefreshing(false); }
  };

  const retry = async () => {
    setLoading(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setLoading(false); }
  };

  // Mais antiga → mais recente (o gráfico lê-se da esquerda para a direita)
  const weeks = [...(stats?.last_weeks ?? [])].reverse();
  const maxWeek = Math.max(1, ...weeks.map((w) => w.earnings));
  const iban = maskIban(vendorData?.iban);

  return (
    <SafeAreaView className={`flex-1 bg-bg ${Platform.OS === 'android' ? 'pb-[90px]' : 'pb-[70px]'}`}>
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <CustomText size="subtitle" color="secondary" boldness="bolder">
          {t('tabs.earnings')}
        </CustomText>
        {/* Histórico de pagamentos recebidos (não os dados de pagamento) */}
        <TouchableOpacity onPress={() => router.push('/(app)/(pages)/(payouts)/payouts')} activeOpacity={0.7}>
          <Feather name="file-text" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {loading && !stats ? (
          // Esqueleto: nunca mostrar 0,00 € antes de saber o valor real.
          <View>
            <Card>
              <SkeletonBlock width="40%" height={12} />
              <SkeletonBlock width="60%" height={30} style={{ marginTop: 10 }} />
              <SkeletonBlock width="50%" height={12} style={{ marginTop: 10 }} />
            </Card>
            <Card className="mt-3">
              <SkeletonBlock width="45%" height={12} />
              <SkeletonBlock width="100%" height={150} radius={12} style={{ marginTop: 14 }} />
            </Card>
            <View className="mt-6">
              <SkeletonList rows={3} />
            </View>
          </View>
        ) : failed && !stats ? (
          <ErrorState
            icon={isOnline ? 'alert-circle' : 'wifi-off'}
            title={t('earnings.error_title')}
            subtitle={isOnline ? t('earnings.error_subtitle') : t('general.offline_subtitle')}
            onRetry={retry}
          />
        ) : (
        <>
        {/* Ganho esta semana */}
        <HeroCard>
          <CustomText size="small" color="muted">{t('earnings.this_week')}</CustomText>
          <CustomText size="headline" color="secondary" boldness="bolder" classes="mt-1">
            {renderMoney(stats?.this_week_earnings ?? 0) || '0,00 €'}
          </CustomText>
          <CustomText size="small" color="muted" classes="mt-1">
            {t('earnings.total_earned', {
              value: renderMoney(stats?.total_earned ?? stats?.total_paid ?? 0) || '0,00 €',
            })}
          </CustomText>
        </HeroCard>

        {/* Por receber: serviços já feitos que ainda não foram pagos. Antes
            desapareciam — só se via o total ganho, como se estivesse tudo pago. */}
        {!!stats?.pending_payment_amount && (
          <Card className="flex-row items-center mt-3">
            <IconTile size={44} tint="rgba(233,162,59,0.16)">
              <Feather name="clock" size={19} color={Colors.warning} />
            </IconTile>
            <View className="flex-1 ml-3">
              <CustomText color="secondary" boldness="semiBold" size="medium">
                {t('earnings.pending_payment_title')}
              </CustomText>
              <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={2}>
                {t('earnings.pending_payment_subtitle', { count: stats?.pending_payment_count ?? 0 })}
              </CustomText>
            </View>
            <CustomText color="secondary" boldness="bolder" size="medium" style={{ color: Colors.warning }}>
              {renderMoney(stats.pending_payment_amount) || '0,00 €'}
            </CustomText>
          </Card>
        )}

        {/* Últimas 4 semanas — barras verticais */}
        <Card className="mt-3">
          <CustomText size="small" color="muted" classes="mb-4">{t('earnings.last_4_weeks_title')}</CustomText>
          <View className="flex-row items-end justify-between" style={{ height: 150 }}>
            {weeks.map((w, i) => {
              const isCurrent = i === weeks.length - 1;
              const h = Math.max(6, (w.earnings / maxWeek) * 100);
              return (
                <View key={w.week_start} className="flex-1 items-center justify-end">
                  <CustomText
                    size="extraSmall"
                    color={isCurrent ? 'brand' : 'muted'}
                    boldness={isCurrent ? 'bold' : 'regular'}
                    classes="mb-1.5"
                  >
                    {Math.round(w.earnings / 100)} €
                  </CustomText>
                  <View
                    className="rounded-lg"
                    style={{
                      width: '58%',
                      height: `${h}%`,
                      minHeight: 6,
                      backgroundColor: isCurrent ? Colors.brand : Colors.card_high,
                    }}
                  />
                  <CustomText
                    size="extraSmall"
                    color={isCurrent ? 'secondary' : 'muted'}
                    boldness={isCurrent ? 'bold' : 'regular'}
                    classes="mt-2 text-center"
                    numberOfLines={1}
                  >
                    {isCurrent ? t('earnings.this_week_short') : shortDate(w.week_start)}
                  </CustomText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Próximo pagamento */}
        <View
          className="rounded-2xl border p-4 mt-3 flex-row items-center"
          style={{ backgroundColor: 'rgba(35,230,158,0.08)', borderColor: 'rgba(35,230,158,0.25)' }}
        >
          <Ionicons name="calendar-clear" size={24} color={Colors.success} />
          <View className="flex-1 ml-3">
            <CustomText size="small" color="muted">{t('earnings.next_payment')}</CustomText>
            <CustomText size="medium" color="secondary" boldness="bolder" classes="mt-0.5" numberOfLines={1}>
              {t('earnings.next_payment_on', { date: longDate(stats?.next_payment_date) })}
            </CustomText>
            <CustomText size="small" color="muted" classes="mt-0.5" numberOfLines={1}>
              {iban
                ? t('earnings.to_iban', { iban })
                : t('earnings.next_payment_hint')}
            </CustomText>
          </View>
        </View>

        {/* Serviços desta semana */}
        <CustomText size="medium" color="secondary" boldness="bold" classes="mt-6 mb-3">
          {t('earnings.week_services')}
        </CustomText>
        {(stats?.completed_this_week?.length ?? 0) === 0 ? (
          <EmptyState
            icon="check-circle"
            title={t('earnings.completed_empty_title')}
            subtitle={t('earnings.completed_empty')}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {stats!.completed_this_week.map((s) => (
              <Card key={s.id} className="flex-row items-center">
                <IconTile size={40} tint="rgba(35,230,158,0.14)">
                  <Ionicons name="checkmark" size={20} color={Colors.success} />
                </IconTile>
                <View className="flex-1 ml-3">
                  <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1}>
                    {s.service_type ?? '—'}
                  </CustomText>
                  {!!s.completed_at && (
                    <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                      {shortDate(s.completed_at)}
                    </CustomText>
                  )}
                </View>
                <CustomText color="secondary" boldness="bolder" size="medium">
                  {renderMoney(s.amount_for_vendor) || '0,00 €'}
                </CustomText>
              </Card>
            ))}
          </View>
        )}
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Earnings;

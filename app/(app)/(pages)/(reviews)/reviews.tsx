/**
 * AVALIAÇÕES — notas e comentários dos clientes.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Card, EmptyState, ErrorState, SkeletonBlock, SkeletonList } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  service_type: string | null;
  customer_name: string | null;
  date: string | null;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Stars = ({ value }: { value: number }) => (
  <View className="flex-row">
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= value ? 'star' : 'star-outline'}
        size={14}
        color={i <= value ? Colors.brand : Colors.muted}
        style={{ marginRight: 1 }}
      />
    ))}
  </View>
);

const RatingBar = ({ star, count, total }: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <CustomText size="extraSmall" color="muted" classes="w-6">{`${star}★`}</CustomText>
      <View
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 8, backgroundColor: Colors.card_high }}
      >
        <View
          className="rounded-full"
          style={{ height: 8, width: `${pct}%`, backgroundColor: Colors.brand }}
        />
      </View>
      <CustomText size="extraSmall" color="muted" classes="w-6 text-right">{`${count}`}</CustomText>
    </View>
  );
};

const Reviews = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [data, setData] = useState<{ average: number | null; total: number; reviews: Review[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isOnline = useIsOnline();

  const load = async () => {
    const r = await api.get(API_ROUTES.VENDOR_GET_REVIEWS);
    setData(r?.data?.data ?? null);
  };

  useEffect(() => {
    load()
      .then(() => setFailed(false))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const retry = async () => {
    setLoading(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setLoading(false); }
  };

  const reviews = data?.reviews ?? [];
  const distribution = React.useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const n = Math.round(Number(r.rating));
      if (n >= 1 && n <= 5) counts[n] += 1;
    });
    return counts;
  }, [reviews]);
  const distTotal = reviews.length;

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setRefreshing(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('reviews.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {loading ? (
          // Sem isto o ecrã mostrava "—" e "0 avaliações" como se fossem reais.
          <View>
            <Card className="items-center py-6">
              <SkeletonBlock width={80} height={32} />
              <SkeletonBlock width={120} height={12} style={{ marginTop: 10 }} />
            </Card>
            <View className="mt-4">
              <SkeletonList rows={3} showIcon={false} />
            </View>
          </View>
        ) : failed ? (
          <ErrorState
            icon={isOnline ? 'alert-circle' : 'wifi-off'}
            title={t('reviews.error_title')}
            subtitle={isOnline ? t('reviews.error_subtitle') : t('general.offline_subtitle')}
            onRetry={retry}
          />
        ) : (
        <>
        {/* Média */}
        <View className="rounded-2xl p-5 items-center" style={{ backgroundColor: 'rgba(250,187,91,0.14)' }}>
          <View className="flex-row items-center">
            <CustomText size="headline" color="secondary" boldness="bolder">
              {data?.average != null ? data.average.toFixed(1) : '—'}
            </CustomText>
            <Ionicons name="star" size={24} color={Colors.brand} style={{ marginLeft: 6 }} />
          </View>
          <CustomText size="small" color="muted" classes="mt-1">
            {t('reviews.total', { count: data?.total ?? 0 })}
          </CustomText>
        </View>

        {/* Distribuição das notas */}
        {distTotal > 0 && (
          <View className="bg-card border rounded-2xl p-4 mt-4" style={{ borderColor: Colors.line }}>
            <CustomText color="secondary" boldness="semiBold" size="small" classes="mb-3">
              {t('reviews.distribution')}
            </CustomText>
            <View style={{ gap: 8 }}>
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar key={star} star={star} count={distribution[star]} total={distTotal} />
              ))}
            </View>
          </View>
        )}

        {distTotal === 0 ? (
          <View className="mt-4">
            <EmptyState
              icon="star"
              title={t('reviews.empty_title')}
              subtitle={t('reviews.empty_subtitle')}
            />
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {data!.reviews.map((review) => (
              <View
                key={review.id}
                className="bg-card border rounded-2xl p-4"
                style={{ borderColor: Colors.line }}
              >
                <View className="flex-row items-center justify-between">
                  <Stars value={review.rating} />
                  <CustomText color="muted" size="extraSmall">{fmtDate(review.date)}</CustomText>
                </View>
                <CustomText color="secondary" boldness="bold" size="medium" classes="mt-2" numberOfLines={1}>
                  {review.customer_name ?? '—'}
                </CustomText>
                <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={1}>
                  {[review.service_type, fmtDate(review.date)].filter(Boolean).join(' · ')}
                </CustomText>
                {!!review.comment && (
                  <CustomText color="secondary" size="small" classes="mt-2">
                    “{review.comment}”
                  </CustomText>
                )}
              </View>
            ))}
          </View>
        )}
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Reviews;

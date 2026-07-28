/**
 * MOVIMENTOS — o extrato real da carteira do técnico.
 *
 * Repõe a lista que existia no antigo separador "wallet" (hoje ocupado pela
 * Agenda). Sem ela, o ícone de recibos nos Ganhos abria o ecrã de DETALHE de um
 * movimento sem lhe passar movimento nenhum, e a app rebentava.
 *
 * Fonte: POST /vendor/wallet/history — transações a sério, com `confirmed`,
 * ao contrário dos totais estimados do ecrã de Ganhos.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import { Card, EmptyState, IconTile } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { PaymentHistoryInterface } from '@/types/wallet';

/** `deposit` entra na carteira; `withdraw` sai (transferência para o banco). */
const isCredit = (type: string) => type !== 'withdraw';

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const Payouts = () => {
  const { t } = useTranslation();
  const { api } = useApi();

  const [transactions, setTransactions] = useState<PaymentHistoryInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [haveMore, setHaveMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (offset = 0) => {
    // O backend devolve sempre 0..offset+limit (cumulativo), por isso substituímos
    // a lista em vez de acrescentar — ver nota no WalletHistoryController.
    const { data } = await api.post(API_ROUTES.POST_PAYMENTS_HISTORY, { offset });
    setTransactions(data?.data?.transactions ?? []);
    setHaveMore(!!data?.data?.have_more);
  }, [api]);

  useEffect(() => {
    load()
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    setFailed(false);
    try { await load(); } catch { setFailed(true); } finally { setRefreshing(false); }
  };

  const retry = async () => {
    setLoading(true);
    setFailed(false);
    try { await load(); } catch { setFailed(true); } finally { setLoading(false); }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try { await load(transactions.length); } catch { /* mantém o que já está */ }
    finally { setLoadingMore(false); }
  };

  const openDetail = (transaction: PaymentHistoryInterface) => {
    router.push({
      pathname: '/(app)/(bottom-sheets)/(wallet)/history',
      params: { history: JSON.stringify(transaction) },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('payouts.title')}
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
          // Esqueleto: distingue "a carregar" de "não tens movimentos".
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="flex-row items-center" style={{ opacity: 0.5 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card_high }} />
                <View className="flex-1 ml-3">
                  <View style={{ height: 14, width: '55%', borderRadius: 6, backgroundColor: Colors.card_high }} />
                  <View style={{ height: 11, width: '35%', borderRadius: 6, backgroundColor: Colors.card_high, marginTop: 8 }} />
                </View>
              </Card>
            ))}
          </View>
        ) : failed ? (
          <Card className="items-center py-8">
            <View
              className="items-center justify-center rounded-full mb-3"
              style={{ width: 56, height: 56, backgroundColor: 'rgba(255,90,95,0.14)' }}
            >
              <Feather name="wifi-off" size={24} color={Colors.danger} />
            </View>
            <CustomText color="secondary" boldness="semiBold" size="medium" classes="text-center">
              {t('payouts.error_title')}
            </CustomText>
            <CustomText color="muted" size="small" classes="text-center mt-1" numberOfLines={3}>
              {t('payouts.error_subtitle')}
            </CustomText>
            <TouchableOpacity
              onPress={retry}
              activeOpacity={0.85}
              className="rounded-xl px-5 py-3 mt-4"
              style={{ backgroundColor: Colors.brand }}
            >
              <CustomText color="on_brand" boldness="bold" size="small">
                {t('general.try_again')}
              </CustomText>
            </TouchableOpacity>
          </Card>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title={t('payouts.empty_title')}
            subtitle={t('payouts.empty_subtitle')}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {transactions.map((transaction) => {
              const credit = isCredit(transaction.type);
              const color = credit ? Colors.success : Colors.brand;
              return (
                <TouchableOpacity
                  key={transaction.id}
                  activeOpacity={0.85}
                  onPress={() => openDetail(transaction)}
                >
                  <Card className="flex-row items-center">
                    <IconTile size={40} tint={`${color}1F`}>
                      <Feather name={credit ? 'arrow-down-left' : 'arrow-up-right'} size={18} color={color} />
                    </IconTile>

                    <View className="flex-1 ml-3">
                      <CustomText color="secondary" boldness="semiBold" size="medium" numberOfLines={1}>
                        {transaction.service?.description
                          ?? (credit ? t('payouts.type_earning') : t('payouts.type_transfer'))}
                      </CustomText>
                      <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={1}>
                        {fmtDate(transaction.created_at)}
                        {!transaction.confirmed ? ` · ${t('payouts.pending')}` : ''}
                      </CustomText>
                    </View>

                    <CustomText
                      color="secondary"
                      boldness="bolder"
                      size="medium"
                      style={{ color }}
                      numberOfLines={1}
                    >
                      {`${credit ? '+' : '−'}${transaction.amount_formatted} €`}
                    </CustomText>
                  </Card>
                </TouchableOpacity>
              );
            })}

            {haveMore && (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                activeOpacity={0.85}
                className="flex-row items-center justify-center rounded-2xl border py-3 mt-1"
                style={{ borderColor: Colors.line, opacity: loadingMore ? 0.5 : 1 }}
              >
                {loadingMore
                  ? <ActivityIndicator size="small" color={Colors.brand} />
                  : (
                    <CustomText color="brand" boldness="bold" size="small">
                      {t('payouts.load_more')}
                    </CustomText>
                  )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payouts;

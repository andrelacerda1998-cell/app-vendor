/**
 * FALTAS — os serviços a que o técnico faltou e o que cada um lhe custou.
 *
 * Existe porque uma penalização que só vive numa notificação é uma penalização
 * que ele não consegue rever nem discutir: passada a notificação, fica um
 * débito na carteira sem explicação. Aqui vê quais foram, quanto foi cobrado,
 * e tem por onde dizer que houve engano — que acontece (o cliente não estava em
 * casa, a morada estava errada).
 *
 * Contestar NÃO reverte nada: abre um pedido ao suporte, e quem decide é uma
 * pessoa. É a mesma regra com que a falta foi declarada.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { Card, EmptyState, ErrorState, SkeletonList, StatusPill } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';
import { renderMoney } from '@/utils/money';

interface NoShow {
  service_id: number;
  service_type: string | null;
  scheduled_day: string | null;
  scheduled_time: string | null;
  /** Em cêntimos. */
  penalty: number;
  registered_at: string | null;
  disputed: boolean;
}

const fmtWhen = (day?: string | null, time?: string | null) => {
  if (!day) return '';
  const d = new Date(day.split('T')[0]);
  const date = isNaN(d.getTime()) ? day : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  return time ? `${date} · ${String(time).slice(0, 5)}` : date;
};

const NoShows = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();

  const [items, setItems] = useState<NoShow[]>([]);
  const [ratio, setRatio] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Contestação: qual a falta aberta na folha, o texto, e se está a enviar.
  const [disputing, setDisputing] = useState<NoShow | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const r = await api.get(API_ROUTES.VENDOR_NO_SHOWS);
    setItems(r?.data?.data?.no_shows ?? []);
    if (typeof r?.data?.data?.penalty_ratio === 'number') setRatio(r.data.data.penalty_ratio);
  };

  useEffect(() => {
    load().then(() => setFailed(false)).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  const retry = async () => {
    setLoading(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); setFailed(false); } catch { setFailed(true); } finally { setRefreshing(false); }
  };

  const submitDispute = async () => {
    if (!disputing || !message.trim()) return;
    setSending(true);
    try {
      await api.post(API_ROUTES.VENDOR_NO_SHOW_DISPUTE(disputing.service_id), { message: message.trim() });
      // Marca localmente: a resposta certa é "recebemos", não voltar a ir ao
      // servidor só para ver a etiqueta mudar.
      setItems((prev) => prev.map((n) => (n.service_id === disputing.service_id ? { ...n, disputed: true } : n)));
      setDisputing(null);
      setMessage('');
      openDialog({
        title: t('no_shows.dispute.sent_title'),
        subtitle: t('no_shows.dispute.sent_subtitle'),
        closeAfterMSeconds: 3000,
        closeOnClickOutside: true,
      });
    } catch {
      openDialog({
        title: t('no_shows.dispute.error_title'),
        subtitle: t('no_shows.dispute.error_subtitle'),
        closeAfterMSeconds: 3000,
        closeOnClickOutside: true,
      });
    } finally {
      setSending(false);
    }
  };

  const total = items.reduce((sum, n) => sum + (Number(n.penalty) || 0), 0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('no_shows.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* A regra, dita uma vez, no sítio onde ele a vai procurar quando lhe
            doer. A percentagem vem do servidor: se a regra mudar, muda aqui. */}
        <Card>
          <View className="flex-row items-start">
            <Feather name="alert-circle" size={18} color={Colors.warning} style={{ marginTop: 2 }} />
            <CustomText color="secondary" size="small" classes="ml-3 flex-1">
              {t('no_shows.rule', { percent: Math.round(ratio * 100) })}
            </CustomText>
          </View>
        </Card>

        {loading ? (
          <View className="mt-4"><SkeletonList rows={2} /></View>
        ) : failed ? (
          <View className="mt-4">
            <ErrorState
              icon={isOnline ? 'alert-circle' : 'wifi-off'}
              title={t('no_shows.error_title')}
              subtitle={isOnline ? t('no_shows.error_subtitle') : t('general.offline_subtitle')}
              onRetry={retry}
            />
          </View>
        ) : items.length === 0 ? (
          <View className="mt-4">
            <EmptyState icon="check-circle" title={t('no_shows.empty_title')} subtitle={t('no_shows.empty_subtitle')} />
          </View>
        ) : (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <CustomText size="medium" color="secondary" boldness="bold">
                {t('no_shows.count', { count: items.length })}
              </CustomText>
              <CustomText size="medium" color="danger" boldness="bolder">
                −{renderMoney(total) || ''}
              </CustomText>
            </View>

            <View style={{ gap: 10 }}>
              {items.map((n) => (
                <Card key={n.service_id}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={2}>
                        {n.service_type ?? t('services.service.no_type')}
                      </CustomText>
                      <CustomText color="muted" size="small" classes="mt-0.5">
                        {fmtWhen(n.scheduled_day, n.scheduled_time)}
                      </CustomText>
                    </View>
                    <View className="items-end">
                      <CustomText color="muted" size="extraSmall">{t('no_shows.penalty')}</CustomText>
                      <CustomText color="danger" boldness="bolder" size="medium">
                        −{renderMoney(n.penalty) || ''}
                      </CustomText>
                    </View>
                  </View>

                  <View className="h-px my-3" style={{ backgroundColor: Colors.line }} />

                  {n.disputed ? (
                    <View className="flex-row items-center justify-between">
                      <StatusPill color={Colors.warning} label={t('no_shows.dispute.pending')} />
                      <CustomText color="muted" size="extraSmall">{t('no_shows.dispute.pending_hint')}</CustomText>
                    </View>
                  ) : (
                    <CustomTouchableOpacity
                      type="secondary_outline"
                      size="medium"
                      text={t('no_shows.dispute.button')}
                      textColor="secondary"
                      textBoldness="semiBold"
                      onPress={() => { setDisputing(n); setMessage(''); }}
                    />
                  )}
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Folha de contestação. Um campo só: o que ele tem para dizer. O
          assunto e a ligação ao serviço são postos pelo servidor. */}
      <Modal visible={!!disputing} transparent animationType="slide" onRequestClose={() => setDisputing(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <Pressable className="flex-1" onPress={() => setDisputing(null)} />
          <View
            className="rounded-t-3xl px-5 pt-3"
            style={{ backgroundColor: Colors.card, paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="self-center rounded-full mb-4" style={{ width: 40, height: 4, backgroundColor: Colors.line }} />

            <CustomText size="large" color="secondary" boldness="bolder">
              {t('no_shows.dispute.title')}
            </CustomText>
            <CustomText size="small" color="muted" classes="mt-1">
              {t('no_shows.dispute.subtitle')}
            </CustomText>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('no_shows.dispute.placeholder')}
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
              className="rounded-xl border px-4 py-3 mt-4"
              style={{ borderColor: Colors.line, color: Colors.secondary, minHeight: 110, fontFamily: 'Poppins_500Medium' }}
            />

            <CustomTouchableOpacity
              type="support_primary"
              size="large"
              text={sending ? t('support.sending') : t('no_shows.dispute.send')}
              textColor="on_brand"
              textBoldness="bold"
              onPress={submitDispute}
              disabled={sending || !message.trim()}
              classes="mt-4"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default NoShows;

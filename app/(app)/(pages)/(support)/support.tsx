import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
/**
 * SUPORTE — o técnico cria tickets que a Piquet responde no backoffice.
 */
import React, { useEffect, useState } from 'react';
import { track, AnalyticsEvent } from '@/utils/analytics';
import { View, ScrollView, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import CheckMark from '@/assets/icons/check-mark';
import { ErrorState, StatusPill } from '@/components/ui';
import XIcon from '@/assets/icons/x';
import { formatMediumDate as fmtDate } from '@/utils/date';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  admin_reply: string | null;
  created_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#E9A23B',
  answered: '#35C46B',
  closed: '#9A9AA1',
};


const FAQ_KEYS = ['payments', 'auto_accept', 'hourly_rate', 'missed_request'] as const;

const Support = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [ticketsFailed, setTicketsFailed] = useState(false);

  const loadTickets = async () => {
    try {
      const r = await api.get(API_ROUTES.VENDOR_SUPPORT_TICKETS);
      setTickets(r?.data?.data?.tickets ?? []);
      setTicketsFailed(false);
    } catch {
      // Falhar em silêncio fazia a lista parecer vazia — como se o técnico
      // nunca tivesse contactado o suporte. Regra da app: erro nunca se
      // disfarça de "não tens nada".
      setTicketsFailed(true);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await loadTickets(); } finally { setRefreshing(false); }
  };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await api.post(API_ROUTES.VENDOR_SUPPORT_TICKETS, {
        subject: subject.trim(),
        message: message.trim(),
      });
      track(AnalyticsEvent.SUPPORT_CONTACTED);
      setSubject('');
      setMessage('');
      openDialog({
        icon: <CheckMark color={Colors.primary} />,
        title: t('support.sent_title'),
        subtitle: t('support.sent_subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
      loadTickets();
    } catch {
      openDialog({
        icon: <XIcon color={Colors.primary} />,
        title: t('errors.support_send.title'),
        subtitle: t('errors.support_send.subtitle'),
        closeAfterMSeconds: 2500,
        closeOnClickOutside: true,
      });
    } finally {
      setSending(false);
    }
  };

  const statusLabel = (s: Ticket['status']) => t(`support.status.${s}`);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('support.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <KeyboardAwareScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* Novo ticket */}
        <View className="border rounded-2xl p-4" style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}>
          <CustomText color="secondary" boldness="bold" size="medium">
            {t('support.new_ticket')}
          </CustomText>
          <CustomText color="muted" size="small" classes="mt-1">
            {t('support.new_ticket_hint')}
          </CustomText>

          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder={t('support.subject_placeholder')}
            placeholderTextColor={Colors.muted}
            maxLength={150}
            className="rounded-xl border px-4 mt-4"
            style={{ borderColor: Colors.line, color: Colors.secondary, height: 48, fontFamily: 'Poppins_500Medium' }}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('support.message_placeholder')}
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={4}
            maxLength={5000}
            textAlignVertical="top"
            className="rounded-xl border px-4 py-3 mt-3"
            style={{ borderColor: Colors.line, color: Colors.secondary, minHeight: 100, fontFamily: 'Poppins_500Medium' }}
          />

          <CustomTouchableOpacity
            type="support_primary"
            size="large"
            text={sending ? t('support.sending') : t('support.send')}
            textColor="on_brand"
            textBoldness="bold"
            onPress={submit}
            disabled={sending || !subject.trim() || !message.trim()}
            classes="mt-4"
          />
        </View>

        {/* FAQ */}
        <CustomText size="medium" color="secondary" boldness="bolder" classes="mt-6 mb-3">
          {t('support.faq.title')}
        </CustomText>
        <View style={{ gap: 10 }}>
          {FAQ_KEYS.map((key) => {
            const expanded = openFaq === key;
            return (
              <View
                key={key}
                className="border rounded-2xl p-4"
                style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}
              >
                <TouchableOpacity
                  onPress={() => setOpenFaq(expanded ? null : key)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between"
                >
                  <CustomText color="secondary" boldness="semiBold" size="small" classes="flex-1 pr-3">
                    {t(`support.faq.items.${key}.q`)}
                  </CustomText>
                  <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.muted} />
                </TouchableOpacity>
                {expanded && (
                  <CustomText color="muted" size="small" classes="mt-2">
                    {t(`support.faq.items.${key}.a`)}
                  </CustomText>
                )}
              </View>
            );
          })}
        </View>

        {/* Tickets anteriores — a falha de carregamento aparece, com retry. */}
        {ticketsFailed && tickets.length === 0 && (
          <View className="mt-6">
            <ErrorState
              title={t('support.tickets_error_title')}
              subtitle={t('support.tickets_error_subtitle')}
              onRetry={loadTickets}
            />
          </View>
        )}
        {tickets.length > 0 && (
          <>
            <CustomText size="medium" color="secondary" boldness="bold" classes="mt-6 mb-3">
              {t('support.my_tickets')}
            </CustomText>
            <View style={{ gap: 10 }}>
              {tickets.map((ticket) => (
                <View
                  key={ticket.id}
                  className="border rounded-2xl p-4"
                  style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}
                >
                  <View className="flex-row items-center justify-between">
                    <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1} classes="flex-1 pr-3">
                      {ticket.subject}
                    </CustomText>
                    <StatusPill
                      color={STATUS_COLORS[ticket.status]}
                      label={statusLabel(ticket.status)}
                    />
                  </View>
                  <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                    {fmtDate(ticket.created_at)}
                  </CustomText>
                  <CustomText color="muted" size="small" numberOfLines={4} classes="mt-2">
                    {ticket.message}
                  </CustomText>

                  {!!ticket.admin_reply && (
                    <View className="rounded-xl p-3 mt-3" style={{ backgroundColor: 'rgba(250,187,91,0.10)' }}>
                      <View className="flex-row items-center mb-1">
                        <Feather name="corner-down-right" size={13} color={Colors.brand} />
                        <CustomText size="extraSmall" color="brand" boldness="bold" classes="ml-1.5">
                          {t('support.reply_from_piquet')}
                        </CustomText>
                      </View>
                      <CustomText color="secondary" size="small">
                        {ticket.admin_reply}
                      </CustomText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Support;

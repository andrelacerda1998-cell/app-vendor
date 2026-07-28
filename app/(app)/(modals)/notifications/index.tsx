/**
 * NOTIFICAÇÕES — lista agrupada por dia (Hoje / Ontem / data), com ícone por tipo.
 *
 * O payload do backend (GET /common/notifications) traz apenas:
 *   { title, body, date, id, read_at, ...extras do toArray() da notificação }
 * Não existe campo `type` nem um alvo de navegação universal, por isso o tipo é
 * derivado por palavra-chave no título/corpo e o toque apenas marca como lida.
 */
import { Colors } from '@/constants/Colors'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import { useTranslation } from "react-i18next"
import { CustomText } from "@/components/CustomText";
import { useSession } from "@/contexts/SessionContext";
import { Card, EmptyState, IconTile } from "@/components/ui";
import i18n from "@/translation";

interface Notification {
  title: string,
  body: string,
  date: string,
  id: string,
  read_at: string|null,
}

type Row =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'item'; key: string; item: Notification };

type NotificationKind = 'request' | 'payment' | 'schedule' | 'document' | 'default';

const KIND_STYLE: Record<NotificationKind, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  request: { icon: 'bell', color: Colors.brand },
  payment: { icon: 'credit-card', color: Colors.success },
  schedule: { icon: 'calendar', color: Colors.brand },
  document: { icon: 'file-text', color: Colors.warning },
  default: { icon: 'info', color: Colors.muted },
};

/** Deriva o tipo por palavra-chave (PT/EN) — não há campo `type` no payload. */
const kindOf = (n: Notification): NotificationKind => {
  const text = `${n.title ?? ''} ${n.body ?? ''}`.toLowerCase();
  if (/pedido|request|servi[çc]o dispon/.test(text)) return 'request';
  if (/pagamento|payment|transfer[êe]ncia|payout/.test(text)) return 'payment';
  if (/agendamento|agendad|schedule|marca[çc][ãa]o/.test(text)) return 'schedule';
  if (/documento|document|comprovativo/.test(text)) return 'document';
  return 'default';
};

const MONTHS: Record<'pt' | 'en', string[]> = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** Chave YYYY-MM-DD em hora local — usada para agrupar. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const hourLabel = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const Notifications = () => {
  const { api } = useApi();
  const { t } = useTranslation();
  const { vendorData, setVendorData } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(API_ROUTES.COMMON_GET_NOTIFICATIONS)
        .then(res=>{
          setNotifications(res.data.data.notifications);
          if (vendorData?.user?.notifications !== undefined) {
            const newNotificationsUnread = vendorData?.user?.notifications <= res.data.data.notifications.length
              ? 0
              : vendorData?.user?.notifications - res.data.data.notifications.length;
            setVendorData({
              ...vendorData,
              user: {
                ...vendorData.user,
                notifications: newNotificationsUnread,
              }
            })
          }
        })
        .finally(() => {
          setLoading(false);
        })
  }, []);

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.push("/(app)/(tabs)/home");
  };

  /** Marca localmente como lida (o backend já marca ao servir a lista). */
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)),
    );
  };

  const groupLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dayKey(d) === dayKey(today)) return t('session.notifications.today');
    if (dayKey(d) === dayKey(yesterday)) return t('session.notifications.yesterday');

    const months = i18n.language === 'en_US' ? MONTHS.en : MONTHS.pt;
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  /** Lista plana com cabeçalhos de dia intercalados. */
  const rows = useMemo<Row[]>(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const out: Row[] = [];
    let currentKey: string | null = null;

    sorted.forEach((item) => {
      const d = new Date(item.date);
      if (isNaN(d.getTime())) {
        out.push({ kind: 'item', key: String(item.id), item });
        return;
      }
      const key = dayKey(d);
      if (key !== currentKey) {
        currentKey = key;
        out.push({ kind: 'header', key: `h-${key}`, label: groupLabel(d) });
      }
      out.push({ kind: 'item', key: String(item.id), item });
    });

    return out;
  }, [notifications, t]);

  return (
    <SafeAreaView className="flex-1 bg-bg py-5">
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('session.notifications.header')}
          </CustomText>
        )}
        onBack={onClose}
        otherClasses="px-5"
      />

      <View className="flex-1 pt-4">
        {loading ? (
          <View className="px-5" style={{ gap: 10 }}>
            {Array.from({length: 8}).map((_, index) => (
              <View
                key={`loading-notifications-${index}`}
                className="rounded-2xl border"
                style={{ borderColor: Colors.line, backgroundColor: Colors.card, height: 78 }}
              />
            ))}
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            ListEmptyComponent={() => (
              <EmptyState
                icon="bell"
                title={t('session.notifications.empty_title')}
                subtitle={t('session.notifications.empty')}
              />
            )}
            renderItem={({ item: row }) => {
              if (row.kind === 'header') {
                return (
                  <CustomText size="small" color="muted" boldness="bold" classes="mt-4 mb-2">
                    {row.label}
                  </CustomText>
                );
              }

              const item = row.item;
              const unread = !item.read_at;
              const style = KIND_STYLE[kindOf(item)];
              const d = new Date(item.date);
              const time = isNaN(d.getTime()) ? '' : hourLabel(d);

              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  className="mb-2.5"
                  onPress={() => markAsRead(item.id)}
                >
                  <Card style={unread ? { backgroundColor: Colors.card_high } : undefined}>
                    <View className="flex-row items-center">
                      <IconTile size={44} tint={`${style.color}22`}>
                        <Feather name={style.icon} size={20} color={style.color} />
                      </IconTile>

                      <View className="flex-1 ml-3">
                        <CustomText
                          boldness="semiBold"
                          color="secondary"
                          size="small"
                          numberOfLines={1}
                        >
                          {item.title}
                        </CustomText>
                        <CustomText color="muted" size="extraSmall" numberOfLines={2} classes="mt-0.5">
                          {item.body}
                        </CustomText>
                        {!!time && (
                          <CustomText color="muted" size="extraSmall" classes="mt-1">
                            {time}
                          </CustomText>
                        )}
                      </View>

                      {unread && (
                        <View
                          className="ml-2 rounded-full"
                          style={{ width: 6, height: 6, backgroundColor: Colors.brand }}
                        />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default Notifications;

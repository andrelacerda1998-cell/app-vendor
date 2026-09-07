/**
 * OS MEUS DOCUMENTOS — estado dos documentos obrigatórios, como os obter e
 * credenciais do subutilizador AT.
 * Espelha o ecrã Flutter piquet_pro/lib/screens/account/documents_screen.dart
 */
import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

import BackHeader from '@/components/app/BackHeader';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import TouchOpacity from '@/components/TouchOpacity';
import { Card, SectionHeader, EmptyState, ErrorState, SkeletonList } from '@/components/ui';
import { useIsOnline } from '@/hooks/useIsOnline';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { useDialog } from '@/contexts/DialogContext';
import { useSession } from '@/contexts/SessionContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import CheckMark from '@/assets/icons/check-mark';
import XIcon from '@/assets/icons/x';

interface Doc {
  id: number;
  document_id: number;
  name: string | null;
  status: string;
  reason: string | null;
  expiration_date: string | null;
  days_to_expire: number | null;
  is_expired: boolean;
  is_expiring_soon: boolean;
  /** Descrição vinda dos tipos de documento do backend (serve de hint). */
  description?: string | null;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Tipo do documento inferido pelo nome — o backend não devolve um enum. */
type DocKind = 'citizen_card' | 'criminal_record' | 'activity' | null;

const docKind = (name?: string | null): DocKind => {
  const n = (name ?? '').toLowerCase();
  if (n.includes('cidadão') || n.includes('cidadao')) return 'citizen_card';
  if (n.includes('criminal')) return 'criminal_record';
  if (n.includes('atividade')) return 'activity';
  return null;
};

const HELP_URLS: Record<Exclude<DocKind, null>, string> = {
  citizen_card: 'https://eportugal.gov.pt/servicos/pedir-o-cartao-de-cidadao',
  criminal_record: 'https://eportugal.gov.pt/servicos/pedir-o-certificado-do-registo-criminal',
  activity: 'https://eportugal.gov.pt/servicos/iniciar-atividade-empresarial',
};

const MyDocuments = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { openDialog } = useDialog();
  const { vendorData, setVendorData } = useSession();

  const [docs, setDocs] = useState<Doc[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isOnline = useIsOnline();

  const [atUser, setAtUser] = useState('');
  const [atPassword, setAtPassword] = useState('');
  const [atEditing, setAtEditing] = useState(false);
  const [atSaving, setAtSaving] = useState(false);

  /**
   * Junta os tipos obrigatórios com os já submetidos, para os documentos em falta
   * aparecerem na lista como "Por submeter" em vez do ecrã ficar vazio.
   */
  const load = async () => {
    // Se AS DUAS chamadas falharem não há lista nenhuma para construir — isso é
    // um erro de rede, não "ainda não submeteste documentos". Com só uma a
    // falhar ainda dá para montar uma lista útil, por isso não se estraga tudo.
    let submittedFailed = false;
    let typesFailed = false;

    const [submitted, types] = await Promise.all([
      api.get(API_ROUTES.GET_DOCUMENTS)
        .then((r: any) => r?.data?.data?.documents ?? [])
        .catch(() => { submittedFailed = true; return []; }),
      api.get(API_ROUTES.GET_DOCUMENTS_TYPES)
        .then((r: any) => r?.data?.data?.types ?? [])
        .catch(() => { typesFailed = true; return []; }),
    ]);

    if (submittedFailed && typesFailed) {
      throw new Error('documents_unavailable');
    }

    const byType = new Map<number, Doc>();
    (submitted as Doc[]).forEach((d) => byType.set(d.document_id, d));

    const merged: Doc[] = (Array.isArray(types) ? types : []).map((type: any) => {
      const existing = byType.get(type.id);
      if (existing) return { ...existing, name: existing.name ?? type.name, description: type.description ?? null };
      return {
        id: -type.id,
        document_id: type.id,
        name: type.name ?? null,
        description: type.description ?? null,
        status: 'not_submitted',
        reason: null,
        expiration_date: null,
        days_to_expire: null,
        is_expired: false,
        is_expiring_soon: false,
      };
    });

    // Documentos submetidos que já não constam dos tipos ficam à mesma visíveis.
    (submitted as Doc[]).forEach((d) => {
      if (!merged.some((m) => m.document_id === d.document_id)) merged.push(d);
    });

    setDocs(merged);
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

  const statusUi = (d: Doc) => {
    if (d.is_expired) return { label: t('my_documents.status.expired'), color: Colors.danger, icon: 'alert-circle' as const };
    if (d.is_expiring_soon) return { label: t('my_documents.status.expiring', { days: d.days_to_expire }), color: Colors.warning, icon: 'clock' as const };
    if (d.status === 'approved') return { label: t('my_documents.status.approved'), color: Colors.success, icon: 'check-circle' as const };
    if (d.status === 'declined') return { label: t('my_documents.status.declined'), color: Colors.danger, icon: 'x-circle' as const };
    if (!d.status || d.status === 'not_submitted' || d.status === 'missing') {
      return { label: t('documents_help.not_submitted'), color: Colors.muted, icon: 'upload' as const };
    }
    return { label: t('my_documents.status.pending'), color: Colors.warning, icon: 'clock' as const };
  };

  const atConfigured = !!vendorData?.at_user;
  const showAtForm = !atConfigured || atEditing;

  const saveAt = () => {
    if (atSaving) return;
    setAtSaving(true);
    api.post(API_ROUTES.POST_AT_USER, { at_user: atUser, at_password: atPassword })
      .then(() => {
        setVendorData({ ...(vendorData ?? {}), at_user: atUser, at_valid: true });
        setAtPassword('');
        setAtEditing(false);
        openDialog({
          icon: <CheckMark color={Colors.primary} />,
          title: t('documents_help.at.saved'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        });
      })
      .catch(() => {
        openDialog({
          icon: <XIcon color={Colors.primary} />,
          title: t('errors.at_user_save.title'),
          subtitle: t('errors.at_user_save.subtitle'),
          closeAfterMSeconds: 2000,
          closeOnClickOutside: true,
        });
      })
      .finally(() => setAtSaving(false));
  };

  const inputStyle = {
    borderColor: Colors.line,
    color: Colors.secondary,
    height: 48,
    fontFamily: 'Poppins_500Medium',
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {t('my_documents.title')}
          </CustomText>
        )}
        otherClasses="px-5 py-4"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        <CustomText color="muted" size="small" classes="mb-4" numberOfLines={4}>
          {t('documents_help.intro')}
        </CustomText>

        {loading && docs.length === 0 ? (
          <SkeletonList rows={3} showIcon={false} />
        ) : failed && docs.length === 0 ? (
          <ErrorState
            icon={isOnline ? 'alert-circle' : 'wifi-off'}
            title={t('my_documents.error_title')}
            subtitle={isOnline ? t('my_documents.error_subtitle') : t('general.offline_subtitle')}
            onRetry={retry}
          />
        ) : docs.length === 0 ? (
          <EmptyState icon="file-text" title={t('my_documents.empty')} />
        ) : (
          <View style={{ gap: 12 }}>
            {docs.map((doc) => {
              const ui = statusUi(doc);
              const kind = docKind(doc.name);
              const submitted = !!doc.status && doc.status !== 'not_submitted' && doc.status !== 'missing';
              return (
                <Card key={doc.id}>
                  <View className="flex-row items-start">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-baseline flex-wrap">
                        <CustomText color="secondary" boldness="bold" numberOfLines={2}>
                          {doc.name ?? '—'}
                        </CustomText>
                        <CustomText color="danger" size="extraSmall">
                          {t('documents_help.required')}
                        </CustomText>
                      </View>
                      {!!(doc.description || kind) && (
                        <CustomText color="muted" size="extraSmall" classes="mt-0.5" numberOfLines={3}>
                          {doc.description || t(`documents_help.hints.${kind}`)}
                        </CustomText>
                      )}
                    </View>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: `${ui.color}38` }}
                    >
                      <CustomText color="secondary" size="extraSmall" boldness="bold" style={{ color: ui.color }}>
                        {ui.label}
                      </CustomText>
                    </View>
                  </View>

                  {!!doc.expiration_date && (
                    <View className="flex-row items-center mt-2">
                      <Feather name="calendar" size={13} color={Colors.muted} />
                      <CustomText size="extraSmall" color="muted" classes="ml-1.5">
                        {t('my_documents.valid_until', { date: fmtDate(doc.expiration_date) })}
                      </CustomText>
                    </View>
                  )}

                  {!!doc.reason && (
                    <CustomText size="small" color="danger" classes="mt-2" numberOfLines={3}>
                      {doc.reason}
                    </CustomText>
                  )}

                  {!!kind && (
                    <TouchOpacity
                      onPress={() => Linking.openURL(HELP_URLS[kind])}
                      otherClasses="flex-row items-center mt-3"
                    >
                      <Feather name="external-link" size={14} color={Colors.brand} />
                      <CustomText color="brand" size="extraSmall" boldness="bold" classes="ml-1.5">
                        {t('documents_help.how_to_get')}
                      </CustomText>
                    </TouchOpacity>
                  )}

                  <CustomTouchableOpacity
                    type="support_primary_outline"
                    size="medium"
                    textSize="small"
                    text={submitted ? t('documents_help.replace') : t('documents_help.submit')}
                    textColor="brand"
                    textBoldness="bold"
                    onPress={() => router.push('/(app)/(modals)/documents')}
                    classes="mt-3 self-end px-6"
                  />
                </Card>
              );
            })}
          </View>
        )}

        <SectionHeader title={t('documents_help.at.section')} classes="mt-8" />
        <Card>
          <View className="flex-row items-center">
            <CustomText color="secondary" boldness="bold" classes="flex-1" numberOfLines={1}>
              {t('documents_help.at.title')}
            </CustomText>
            {atConfigured && !atEditing && (
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${Colors.success}38` }}>
                <CustomText color="success" size="extraSmall" boldness="bold">
                  {t('documents_help.at.configured')}
                </CustomText>
              </View>
            )}
          </View>

          <CustomText color="muted" size="small" classes="mt-1" numberOfLines={6}>
            {t('documents_help.at.description')}
          </CustomText>

          {atConfigured && !atEditing ? (
            <View className="mt-3">
              <CustomText color="secondary" boldness="semiBold" numberOfLines={1}>
                {vendorData?.at_user}
              </CustomText>
              <CustomText color="muted" size="extraSmall" classes="mt-0.5">
                {t('documents_help.at.password_saved')}
              </CustomText>
              <CustomTouchableOpacity
                type="support_primary_outline"
                size="medium"
                textSize="small"
                text={t('documents_help.at.change')}
                textColor="brand"
                textBoldness="bold"
                onPress={() => {
                  setAtUser(vendorData?.at_user ?? '');
                  setAtEditing(true);
                }}
                classes="mt-3"
              />
            </View>
          ) : (
            <View className="mt-3">
              <CustomText color="muted" size="extraSmall" classes="mb-1.5">
                {t('documents_help.at.user_label')}
              </CustomText>
              <TextInput
                value={atUser}
                onChangeText={setAtUser}
                placeholder={t('documents_help.at.user_placeholder')}
                placeholderTextColor={Colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-xl border px-4"
                style={inputStyle}
              />

              <CustomText color="muted" size="extraSmall" classes="mt-3 mb-1.5">
                {t('documents_help.at.password_label')}
              </CustomText>
              <TextInput
                value={atPassword}
                onChangeText={setAtPassword}
                secureTextEntry
                placeholderTextColor={Colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-xl border px-4"
                style={inputStyle}
              />

              <CustomTouchableOpacity
                type="support_primary"
                size="medium"
                textSize="small"
                text={t('documents_help.at.save')}
                textColor="on_brand"
                textBoldness="bold"
                disabled={atSaving || !atUser || !atPassword}
                onPress={saveAt}
                classes="mt-4"
              />
            </View>
          )}
        </Card>

        <CustomTouchableOpacity
          type="support_primary"
          size="large"
          textSize="medium"
          text={t('my_documents.submit_or_replace')}
          textColor="on_brand"
          textBoldness="bold"
          onPress={() => router.push('/(app)/(modals)/documents')}
          classes="mt-5"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyDocuments;

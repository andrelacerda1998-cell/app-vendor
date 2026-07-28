/**
 * TEMPO EXTRA e PEÇAS/MATERIAIS — pedidos feitos durante o serviço.
 * Só entram no valor a receber depois de o cliente aprovar.
 */
import React, { useEffect, useState } from 'react';
import { View, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import { Colors } from '@/constants/Colors';
import { useApi } from '@/contexts/ApiContext';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { renderMoney } from '@/utils/money';

interface Extra {
  id: number;
  type: 'time' | 'part';
  description: string | null;
  minutes: number | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  rejection_reason?: string | null;
}

const PRESET_MINUTES = [15, 30, 45, 60];

export type ExtrasSheet = 'time' | 'part' | null;

/**
 * Lista dos extras do serviço.
 *
 * Os botões de acrescentar vivem no rodapé do ecrã (ao lado do "Concluir
 * serviço"), por isso a folha aberta pode ser controlada de fora — `sheet` e
 * `onSheetChange`. Sem essas props, o componente gere o estado sozinho.
 */
const ServiceExtras = ({
  serviceId,
  enabled,
  sheet,
  onSheetChange,
}: {
  serviceId?: number | string;
  enabled: boolean;
  sheet?: ExtrasSheet;
  onSheetChange?: (next: ExtrasSheet) => void;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [extras, setExtras] = useState<Extra[]>([]);
  const [ownSheet, setOwnSheet] = useState<ExtrasSheet>(null);

  const openSheet = sheet !== undefined ? sheet : ownSheet;
  const setSheet = (next: ExtrasSheet) => (onSheetChange ? onSheetChange(next) : setOwnSheet(next));
  const timeSheet = openSheet === 'time';
  const partSheet = openSheet === 'part';
  const setTimeSheet = (open: boolean) => setSheet(open ? 'time' : null);
  const setPartSheet = (open: boolean) => setSheet(open ? 'part' : null);
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mensagem do servidor quando existe, senão o texto genérico do ecrã.
  const errorMessage = (e: any, fallbackKey: string) =>
    e?.response?.data?.metadata?.message
    || e?.response?.data?.message
    || t(fallbackKey);

  const load = async () => {
    if (!serviceId) return;
    try {
      const r = await api.get(API_ROUTES.VENDOR_SERVICE_EXTRAS(serviceId));
      setExtras(r?.data?.data?.extras ?? []);
      setError(null);
    } catch (e: any) {
      setError(errorMessage(e, 'service_extras.error_load'));
    }
  };

  useEffect(() => { load(); }, [serviceId]);

  const addTime = async (minutes: number) => {
    setBusy(true);
    try {
      await api.post(API_ROUTES.VENDOR_SERVICE_EXTRAS(serviceId!), { type: 'time', minutes });
      setTimeSheet(false);
      setError(null);
      load();
    } catch (e: any) {
      setError(errorMessage(e, 'service_extras.error_add_time'));
    } finally { setBusy(false); }
  };

  const addPart = async () => {
    const cents = Math.round(parseFloat(price.replace(',', '.')) * 100);
    if (!desc.trim() || !Number.isFinite(cents) || cents < 0) {
      setError(t('service_extras.error_invalid_part'));
      return;
    }
    setBusy(true);
    try {
      await api.post(API_ROUTES.VENDOR_SERVICE_EXTRAS(serviceId!), {
        type: 'part', description: desc.trim(), amount: cents,
      });
      setPartSheet(false); setDesc(''); setPrice('');
      setError(null);
      load();
    } catch (e: any) {
      setError(errorMessage(e, 'service_extras.error_add_part'));
    } finally { setBusy(false); }
  };

  const withdraw = async (extraId: number) => {
    setBusy(true);
    try {
      await api.delete(API_ROUTES.VENDOR_SERVICE_EXTRA_DELETE(serviceId!, extraId));
      setError(null);
      load();
    } catch (e: any) {
      setError(errorMessage(e, 'service_extras.error_withdraw'));
    } finally { setBusy(false); }
  };

  const label = (e: Extra) =>
    e.type === 'time'
      ? t('service_extras.time_label', { minutes: e.minutes })
      : `${e.description} · ${renderMoney(e.amount) || ''}`;

  const pending = extras.filter((e) => e.status === 'pending');
  const approved = extras.filter((e) => e.status === 'approved');
  const rejected = extras.filter((e) => e.status === 'rejected');

  if (!enabled && extras.length === 0 && !error) return null;

  return (
    <View className="bg-card border rounded-2xl p-4 mt-3" style={{ borderColor: Colors.line }}>
      <CustomText color="muted" boldness="bold" size="extraSmall">
        {t('service_extras.title')}
      </CustomText>

      {/* Pedidos à espera de aprovação */}
      {pending.map((e) => (
        <View
          key={e.id}
          className="flex-row items-center rounded-xl p-3 mt-3"
          style={{ backgroundColor: 'rgba(233,162,59,0.12)' }}
        >
          <ActivityIndicator size="small" color={Colors.warning} />
          <CustomText size="small" color="secondary" classes="flex-1 ml-2" numberOfLines={2}>
            {t('service_extras.waiting', { item: label(e) })}
          </CustomText>
          <TouchableOpacity onPress={() => withdraw(e.id)} disabled={busy}>
            <CustomText size="small" color="danger" boldness="bold">
              {t('service_extras.withdraw')}
            </CustomText>
          </TouchableOpacity>
        </View>
      ))}

      {/* Aprovados */}
      {approved.map((e) => (
        <View key={e.id} className="flex-row items-center mt-3">
          <Feather name="check-circle" size={16} color={Colors.success} />
          <CustomText size="small" color="secondary" classes="flex-1 ml-2" numberOfLines={2}>
            {t('service_extras.approved', { item: label(e) })}
          </CustomText>
        </View>
      ))}

      {/* Recusados pelo cliente (com o motivo, quando o cliente o escreveu) */}
      {rejected.map((e) => (
        <View key={e.id} className="flex-row mt-3">
          <Feather name="x-circle" size={16} color={Colors.danger} style={{ marginTop: 2 }} />
          <View className="flex-1 ml-2">
            <CustomText size="small" color="danger" numberOfLines={2}>
              {t('service_extras.rejected', { item: label(e) })}
            </CustomText>
            {!!e.rejection_reason && (
              <CustomText size="extraSmall" color="muted" numberOfLines={3}>
                {t('service_extras.rejected_reason', { reason: e.rejection_reason })}
              </CustomText>
            )}
          </View>
        </View>
      ))}

      {/* Erro da última operação */}
      {!!error && (
        <View className="flex-row items-center mt-3">
          <Feather name="alert-triangle" size={16} color={Colors.danger} />
          <CustomText size="small" color="danger" classes="flex-1 ml-2" numberOfLines={3}>
            {error}
          </CustomText>
        </View>
      )}

      {/* Sheet: tempo extra */}
      <Modal visible={timeSheet} transparent animationType="slide" onRequestClose={() => setTimeSheet(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="rounded-t-3xl p-5" style={{ backgroundColor: Colors.card }}>
            <CustomText size="large" color="secondary" boldness="bolder">
              {t('service_extras.add_time_title')}
            </CustomText>
            <CustomText size="small" color="muted" classes="mt-1 mb-4">
              {t('service_extras.add_time_hint')}
            </CustomText>
            {PRESET_MINUTES.map((m) => (
              <CustomTouchableOpacity
                key={m}
                type="secondary_outline"
                size="large"
                text={m === 60 ? '+ 1 h' : `+ ${m} min`}
                textColor="secondary"
                textBoldness="semiBold"
                onPress={() => addTime(m)}
                disabled={busy}
                classes="mb-2"
              />
            ))}
            <CustomTouchableOpacity
              type="transparent" size="large" text={t('general.cancel')}
              textColor="muted" textBoldness="regular"
              onPress={() => setTimeSheet(false)} classes="mt-1"
            />
          </View>
        </View>
      </Modal>

      {/* Sheet: peça/material */}
      <Modal visible={partSheet} transparent animationType="slide" onRequestClose={() => setPartSheet(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="rounded-t-3xl p-5" style={{ backgroundColor: Colors.card }}>
            <CustomText size="large" color="secondary" boldness="bolder">
              {t('service_extras.add_part_title')}
            </CustomText>
            <CustomText size="small" color="muted" classes="mt-1 mb-4">
              {t('service_extras.add_part_hint')}
            </CustomText>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder={t('service_extras.part_placeholder')}
              placeholderTextColor={Colors.muted}
              className="rounded-xl border px-4 mb-3"
              style={{ borderColor: Colors.line, color: Colors.secondary, height: 48, fontFamily: 'Poppins_500Medium' }}
            />
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder={t('service_extras.value_placeholder')}
              placeholderTextColor={Colors.muted}
              className="rounded-xl border px-4"
              style={{ borderColor: Colors.line, color: Colors.secondary, height: 48, fontFamily: 'Poppins_500Medium' }}
            />
            <CustomTouchableOpacity
              type="support_primary" size="large" text={t('service_extras.ask_client')}
              textColor="on_brand" textBoldness="bold"
              onPress={addPart} disabled={busy || !desc.trim() || !price.trim()} classes="mt-4"
            />
            <CustomTouchableOpacity
              type="transparent" size="large" text={t('general.cancel')}
              textColor="muted" textBoldness="regular"
              onPress={() => setPartSheet(false)} classes="mt-1"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};


/** Botões de acrescentar extras — desenhados no rodapé, junto ao CTA. */
export const ServiceExtrasActions = ({
  onAddTime,
  onAddPart,
  disabled,
}: {
  onAddTime: () => void;
  onAddPart: () => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <View className="flex-row mb-2" style={{ gap: 10 }}>
      <TouchableOpacity
        onPress={onAddTime}
        disabled={disabled}
        className="flex-1 items-center rounded-xl py-3 border"
        style={{ backgroundColor: 'rgba(250,187,91,0.18)', borderColor: 'rgba(250,187,91,0.5)' }}
      >
        <MaterialIcons name="more-time" size={22} color={Colors.brand} />
        <CustomText size="small" color="brand" boldness="bold" classes="mt-1">
          {t('service_extras.extra_time')}
        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onAddPart}
        disabled={disabled}
        className="flex-1 items-center rounded-xl py-3 border"
        style={{ backgroundColor: 'rgba(250,187,91,0.18)', borderColor: 'rgba(250,187,91,0.5)' }}
      >
        <MaterialIcons name="construction" size={22} color={Colors.brand} />
        <CustomText size="small" color="brand" boldness="bold" classes="mt-1">
          {t('service_extras.parts')}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

export default ServiceExtras;

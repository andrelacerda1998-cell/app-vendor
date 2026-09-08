import React, { useEffect, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { CustomText } from '@/components/CustomText'
import { Colors } from '@/constants/Colors'
import { useSchedule } from '@/contexts/ScheduleContext'
import { useSession } from '@/contexts/SessionContext'
import { useApi } from '@/contexts/ApiContext'
import { useDialog } from '@/contexts/DialogContext'
import { API_ROUTES } from '@/constants/ApiRoutes'

/**
 * Cartão de Auto Aceitação da Home (build 12 "AutoAcceptanceTile").
 * Toca para alternar; ativar pede confirmação. Persiste via /vendor/schedule/auto-accept.
 */
const AutoAcceptCard = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const { vendorData } = useSession();
  const { autoAcceptEnabled, setAutoAcceptEnabled, getScheduleSettings } = useSchedule();
  const { openDialog } = useDialog();
  const [saving, setSaving] = useState(false);
  // Convites que caducaram sem resposta na semana corrente. `null` = ainda não
  // sabemos (ou o backend não devolveu) — nesse caso não se mostra nada.
  const [missedWeek, setMissedWeek] = useState<number | null>(null);

  useEffect(() => {
    getScheduleSettings();
  }, []);

  // Reutiliza o histórico que já existe (POST /vendor/services/history com
  // filter=lost) — o campo `totals.missed_invitations_week` conta os convites
  // de seleção que caducaram sem resposta desde segunda-feira.
  //
  // Era `lost_week_amount`, uma soma em euros. Dois problemas: contava serviços
  // em REFUSED, que só o fluxo antigo produz (no matching, recusar marca o
  // candidato e o serviço nunca chega lá), e apresentava como perdido dinheiro
  // que ele nunca teria ganho — mesmo respondendo, teria de ficar no top 3 por
  // ranking e depois ser escolhido pelo cliente.
  useEffect(() => {
    if (autoAcceptEnabled) {
      setMissedWeek(null);
      return;
    }
    let mounted = true;
    api.post(API_ROUTES.POST_SERVICES_HISTORY, { filter: 'lost', offset: 0 })
      .then((res: any) => {
        if (!mounted) return;
        const raw = res?.data?.data?.totals?.missed_invitations_week;
        setMissedWeek(typeof raw === 'number' && raw > 0 ? raw : null);
      })
      .catch(() => { if (mounted) setMissedWeek(null); });
    return () => { mounted = false; };
  }, [autoAcceptEnabled]);

  // Só faz sentido enquanto a conta estiver aprovada para receber serviços.
  if (!vendorData?.can_accept_service) return null;

  const persist = async (enabled: boolean) => {
    setSaving(true);
    const previous = autoAcceptEnabled;
    setAutoAcceptEnabled(enabled); // otimista
    try {
      await api.put(API_ROUTES.VENDOR_UPDATE_AUTO_ACCEPT, { enabled });
    } catch (e) {
      setAutoAcceptEnabled(previous); // reverte em erro
    } finally {
      setSaving(false);
    }
  };

  const onToggle = () => {
    if (saving) return;
    if (autoAcceptEnabled) {
      persist(false);
      return;
    }
    openDialog({
      title: t('schedules.confirmation.auto_accept_title'),
      subtitle: t('schedules.confirmation.auto_accept_subtitle'),
      successButtonText: t('schedules.auto_accept_enable'),
      cancelButtonText: t('general.cancel'),
      dangerCancel: true,
      onSuccess: () => persist(true),
    });
  };

  return (
    <View className="px-5">
      <View
        className="rounded-2xl border p-4"
        style={{ backgroundColor: Colors.card,  borderColor: Colors.line }}
      >
      <View className="flex-row items-center">
        {/* Corpo do cartão: abre o ecrã dedicado */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/(pages)/(auto-acceptance)/auto-acceptance')}
          className="flex-row items-center flex-1"
        >
          <Entypo name="flash" size={26} color={autoAcceptEnabled ? Colors.brand : Colors.muted} />
          <View className="flex-1 ml-3">
            <CustomText color="secondary" boldness="bold" size="medium">
              {t('schedules.auto_acceptance')}
            </CustomText>
            <CustomText color="muted" size="small" boldness="regular" numberOfLines={2} classes="mt-0.5">
              {autoAcceptEnabled ? t('schedules.auto_accept_on') : t('schedules.auto_accept_off')}
            </CustomText>
          </View>
        </TouchableOpacity>

        {/* Interruptor: alterna sem sair da Home */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onToggle}
          disabled={saving}
          className="ml-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="switch"
          accessibilityLabel={t('schedules.auto_acceptance')}
          accessibilityState={{ checked: autoAcceptEnabled, disabled: saving }}
        >
          <View
            className={`w-12 h-7 rounded-full justify-center ${saving ? 'opacity-40' : ''}`}
            style={{ backgroundColor: autoAcceptEnabled ? Colors.support_primary : Colors.gray_strong }}
          >
            <View className={`w-5 h-5 rounded-full bg-white ${autoAcceptEnabled ? 'ml-6' : 'ml-1'}`} />
          </View>
        </TouchableOpacity>
      </View>

      {/* O que passou ao lado por não ter respondido. Contagem e não euros: o
          valor dependia de ser escolhido, e prometê-lo era enganador. Só
          aparece com um número vindo do backend — sem dados, nada é dito. */}
      {!autoAcceptEnabled && missedWeek !== null && (
        <View
          className="flex-row items-center mt-3 pt-3 border-t"
          style={{ borderTopColor: Colors.line }}
        >
          <Entypo name="chevron-with-circle-down" size={16} color={Colors.warning} />
          <CustomText color="warning" size="small" boldness="medium" classes="ml-2 flex-1">
            {t('auto_accept_lost.week', { count: missedWeek })}
          </CustomText>
        </View>
      )}
      </View>
    </View>
  )
}

export default AutoAcceptCard

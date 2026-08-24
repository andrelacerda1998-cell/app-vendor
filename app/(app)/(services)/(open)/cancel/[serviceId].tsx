import { Colors } from '@/constants/Colors'
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View } from 'react-native';
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import useEcho from '@/hooks/echo'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { CustomText } from "@/components/CustomText"
import { useService } from "@/contexts/ServiceContext"
import { useDialog } from "@/contexts/DialogContext"
import { useTranslation } from "react-i18next"
import { renderMoney } from "@/utils/money"

const CancelService = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const echo = useEcho();
  const { openService, setOpenService } = useService();
  const { openDialog } = useDialog();
  // // const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { serviceId } = useLocalSearchParams();

  // Detalhe completo do serviço: é aqui que vêm o agendamento (para saber a
  // antecedência) e o `amount_for_vendor`. O `openService` do contexto pode ser
  // o payload magro, sem estes campos.
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    api.get(API_ROUTES.GET_SERVICE_DETAILS(String(serviceId)))
      .then(({ data }) => { if (!cancelled) setDetails(data?.data?.service ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [serviceId]);

  const svc: any = details ?? openService;

  /**
   * Regra: cancelar com menos de 24h de antecedência tem penalização de 10% do
   * valor do serviço (quem a aplica é o backend).
   *
   * `null` = não sabemos a antecedência (serviço sem agendamento ou detalhe
   * ainda por carregar). Nesse caso enunciamos a regra na condicional, em vez
   * de afirmar que a penalização se aplica.
   */
  const LATE_CANCEL_RATE = 0.1;
  const LATE_WINDOW_MS = 24 * 60 * 60 * 1000;

  const isLate: boolean | null = useMemo(() => {
    const day = String(svc?.schedule?.scheduled_day ?? '').split('T')[0];
    const time = String(svc?.schedule?.scheduled_time?.start ?? '').slice(0, 5);
    const [y, m, d] = day.split('-').map(Number);
    if (!y || !m || !d) return null;
    const [hh, mm] = time.split(':').map(Number);
    const start = new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0);
    if (isNaN(start.getTime())) return null;
    return start.getTime() - Date.now() < LATE_WINDOW_MS;
  }, [svc]);

  // SÓ a parte do técnico. Sem recurso ao `amount` (total pago pelo cliente):
  // cair nele inflacionava a penalização mostrada em ~33%.
  const amountForVendor: number | null =
    typeof svc?.amount_for_vendor === 'number' ? svc.amount_for_vendor : null;
  const penaltyCents = amountForVendor === null ? null : Math.round(amountForVendor * LATE_CANCEL_RATE);
  const penaltyLabel = penaltyCents === null ? null : renderMoney(penaltyCents);

  const penaltyBody = () => {
    if (!penaltyLabel) return t('services.cancel.penalty.body_no_amount');
    if (isLate) return t('services.cancel.penalty.body_now', { amount: penaltyLabel });
    return t('services.cancel.penalty.body', { amount: penaltyLabel });
  };

  /**
   * Executa o cancelamento. Já não abre um diálogo a repetir a penalização: o
   * ecrã inteiro é a confirmação e o botão diz "Confirmar cancelamento" —
   * perguntar outra vez a mesma coisa treinava o técnico a carregar sem ler.
   */
  const handleCancelService = () => {
    if (isLoading) return;
    setIsLoading(true);
    api.post(API_ROUTES.POST_CANCEL_SERVICE(serviceId as string))
      .then(() => {
        openDialog({
          title: t('services.wait_accept.canceled.title'),
          subtitle: t('services.wait_accept.canceled.subtitle'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: false,
          onClose: () => {
            setOpenService(null);
            return router.navigate('/(app)/(tabs)/home');
          }
        })
      })
      .catch(() => {
        openDialog({
          title: t('services.cancel.error.title'),
          subtitle: t('services.cancel.error.subtitle'),
          closeAfterMSeconds: 3000,
          closeOnClickOutside: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <SafeAreaView className="flex-1 bg-strongest">
      {/* <StatusBar backgroundColor={Colors.primary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {openService?.service_type?.name || ''}
          </CustomText>
        )}
        otherClasses="p-5"
      />

      <View className="bg-primary p-5 flex-1 rounded-t-3xl">
        {/* Conteúdo centrado no espaço disponível: o bloco é curto e, encostado
            ao topo, deixava um vazio grande até aos botões. Centrado, a
            respiração fica repartida em cima e em baixo. */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }}
        >
          {/* Ícone menor e vermelho, dentro de um círculo suave: comunica
              "atenção, é destrutivo" sem o bloco branco de 90px a dominar. */}
          <View className="items-center">
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 72, height: 72, backgroundColor: 'rgba(237, 73, 73, 0.14)' }}
            >
              <MaterialIcons name="close" size={36} color={Colors.error} />
            </View>
          </View>

          <CustomText color="secondary" boldness="bolder" size="title" classes="text-center mt-4">
            {t('services.cancel.heading')}
          </CustomText>
          <CustomText color="muted" size="medium" numberOfLines={2} classes="text-center mt-1.5">
            {t('services.cancel.already_accepted')}
          </CustomText>

          {/* O alarme vermelho só aparece quando a penalização é mesmo possível.
              Faltando mais de 24h não há penalização nenhuma — mostrar o aviso
              a toda a hora assustava sem motivo e gastava a credibilidade do
              alerta para quando ele conta. */}
          {isLate === false ? (
            <View
              className="mt-6 rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(35, 230, 158, 0.10)',
                borderWidth: 1,
                borderColor: Colors.success,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <CustomText color="secondary" boldness="semiBold" numberOfLines={2} classes="ml-2 flex-1">
                  {t('services.cancel.no_penalty.title')}
                </CustomText>
              </View>
              <CustomText color="secondary" boldness="regular" numberOfLines={3} classes="mt-1.5">
                {t('services.cancel.no_penalty.body')}
              </CustomText>
            </View>
          ) : (
            <View
              className="mt-6 rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(237, 73, 73, 0.14)',
                borderWidth: 1,
                borderColor: Colors.error,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name="warning" size={20} color={Colors.error} />
                <CustomText color="secondary" boldness="semiBold" numberOfLines={2} classes="ml-2 flex-1">
                  {t('services.cancel.penalty.title')}
                </CustomText>
              </View>
              <CustomText color="secondary" boldness="regular" numberOfLines={4} classes="mt-1.5">
                {penaltyBody()}
              </CustomText>
            </View>
          )}
        </ScrollView>

        {/* A ação segura ("Manter serviço") é a que fica em destaque; cancelar
            é destrutivo e com custo, por isso vive em texto vermelho e não num
            botão cheio a convidar ao toque. */}
        <View style={{ gap: 10 }}>
          <CustomTouchableOpacity
            size="large"
            type="secondary"
            textColor="primary"
            textBoldness="semiBold"
            text={t('services.cancel.keep_service')}
            onPress={() => router.back()}
            disabled={isLoading}
          />
          <CustomTouchableOpacity
            size="large"
            type="danger_outline"
            textColor="error"
            textBoldness="semiBold"
            text={isLoading ? t('services.cancel.canceling') : t('services.cancel.cancel_service')}
            onPress={handleCancelService}
            disabled={isLoading}
          />
        </View>
      </View>

    </SafeAreaView>
  )
}

export default CancelService;

import { Colors } from '@/constants/Colors'
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View } from 'react-native';
import BackHeader from '@/components/app/BackHeader'
import { useApi } from '@/contexts/ApiContext'
import { API_ROUTES } from '@/constants/ApiRoutes'
import useEcho from '@/hooks/echo'
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { CustomText } from "@/components/CustomText"
import { useSession } from '@/contexts/SessionContext';
import { avisoDeCancelamento } from '@/utils/fiabilidade';
import { useService } from "@/contexts/ServiceContext"
import { useDialog } from "@/contexts/DialogContext"
import { useTranslation } from "react-i18next"

const CancelService = () => {
  const { t } = useTranslation();
  const { api } = useApi();
  const echo = useEcho();
  const { openService, setOpenService } = useService();
  const { vendorData, fetchAndSaveUserData } = useSession();
  const { openDialog } = useDialog();
  // // const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { serviceId } = useLocalSearchParams();


  /**
   * A REGRA REAL, e não a que estava escrita.
   *
   * Este ecrã prometia "10% de penalização a menos de 24 horas". O servidor
   * não cobra nada (a taxa está a zero), por isso o técnico era ameaçado com
   * um custo que não existia — e quem descobrisse deixava de acreditar no
   * resto. A regra que existe é outra: ao 3.º cancelamento no mês, 48 horas
   * sem convites. Vem do servidor, já com a contagem dele.
   */
  const aviso = avisoDeCancelamento(vendorData?.reliability);

  // A contagem tem de ser a de agora, não a da cache: pode ter cancelado
  // outro serviço há minutos.
  useEffect(() => { fetchAndSaveUserData(); }, []);

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
            fetchAndSaveUserData();
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.bg }}>
      {/* <StatusBar backgroundColor={Colors.primary} animated /> */}

      <BackHeader
        backButtonColor="secondary"
        middleItem={() => (
          <CustomText color="secondary" boldness="bold" numberOfLines={1}>
            {openService?.service_type?.name || openService?.custom?.description || ''}
          </CustomText>
        )}
        otherClasses="p-5"
      />

      <View className="p-5 flex-1 rounded-t-3xl" style={{ backgroundColor: Colors.primary }}>
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

          {/* A regra, com o número dele. Vermelho quando este cancelamento é o
              que o deixa sem convites (ou prolonga a pausa); âmbar antes disso
              — é um aviso, não um alarme. */}
          {aviso && (
            <View
              className="mt-6 rounded-2xl p-4"
              style={{
                backgroundColor: aviso.daPausa ? 'rgba(237, 73, 73, 0.14)' : 'rgba(250, 187, 91, 0.16)',
                borderWidth: 1,
                borderColor: aviso.daPausa ? Colors.error : Colors.brand,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons name={aviso.daPausa ? 'warning' : 'info'} size={20} color={aviso.daPausa ? Colors.error : Colors.brand} />
                <CustomText color="secondary" boldness="semiBold" numberOfLines={2} classes="ml-2 flex-1">
                  {aviso.jaEmPausa
                    ? t('services.cancel.reliability.title_extend')
                    : aviso.daPausa
                      ? t('services.cancel.reliability.title_pause', { hours: aviso.horas })
                      : t('services.cancel.reliability.title_count', { number: aviso.numero })}
                </CustomText>
              </View>
              <CustomText color="secondary" boldness="regular" numberOfLines={3} classes="mt-1.5">
                {t('services.cancel.reliability.rule', { limit: aviso.limite, hours: aviso.horas })}
              </CustomText>
            </View>
          )}

          <CustomText color="muted" size="small" numberOfLines={2} classes="text-center mt-4">
            {t('services.cancel.reliability.customer')}
          </CustomText>
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

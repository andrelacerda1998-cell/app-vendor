import { useService } from "@/contexts/ServiceContext";
import React, { useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated, Easing } from "react-native"
import { LinearGradient } from 'expo-linear-gradient'
import { CustomText } from "../CustomText";
import { Colors } from "@/constants/Colors";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceStatus } from "@/types/services";
import { useTranslation } from "react-i18next";
import { renderMoney } from "@/utils/money";
import { cardShadow } from "@/components/ui";

/** Ponto que pulsa — sinaliza que o serviço está a decorrer agora. */
const LiveDot = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View className="items-center justify-center" style={{ width: 10, height: 10 }}>
      <Animated.View
        className="absolute rounded-full"
        style={{
          width: 10, height: 10, backgroundColor: Colors.success,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
        }}
      />
      <View className="rounded-full" style={{ width: 7, height: 7, backgroundColor: Colors.success }} />
    </View>
  );
};

/** Cartão do serviço em curso — o bloco mais importante da Home. */
const OpenService = () => {
  const { t } = useTranslation();
  const { openService } = useService();
  const svc: any = openService;

  // Cada estado tem o seu próprio símbolo
  const ui = svc?.status === ServiceStatus.FINISHED
    ? {
        label: t('services.service.status.steps.completed'),
        color: Colors.success,
        icon: <Ionicons name="checkmark-done" size={26} color={Colors.strongest} />,
        live: false,
      }
    : svc?.status === ServiceStatus.ARRIVED
    ? {
        label: t('services.service.status.steps.in_progress'),
        color: Colors.success,
        icon: <MaterialCommunityIcons name="progress-wrench" size={26} color={Colors.strongest} />,
        live: true,
      }
    : svc?.on_the_way_at
    ? {
        label: t('services.service.status.steps.on_the_way'),
        color: Colors.brand,
        icon: <Ionicons name="navigate" size={24} color={Colors.strongest} />,
        live: true,
      }
    : {
        label: t('services.service.status.steps.accepted'),
        color: Colors.brand,
        icon: <Ionicons name="checkmark-circle" size={26} color={Colors.strongest} />,
        live: false,
      };

  // SÓ a parte do técnico. O fallback para `amount` (total pago pelo cliente)
  // mostrava aqui um valor ~33% acima do que o técnico realmente recebe.
  const price = renderMoney(svc?.amount_for_vendor ?? null);

  /**
   * Serviço esquecido em execução.
   *
   * Sem o toque em "Concluir serviço" o serviço nunca fecha: o técnico não é
   * pago e a app não lhe dizia nada — encontrámos um parado há 70h e outro há
   * 480h, ambos a mostrar o cartão verde normal, como se estivesse tudo bem.
   * A partir de 3h o cartão muda de tom e diz há quanto tempo está parado.
   */
  const inProgressSince = svc?.status === ServiceStatus.ARRIVED
    ? new Date(svc?.updated_at ?? svc?.on_the_way_at ?? Date.now()).getTime()
    : null;
  const hoursStuck = inProgressSince
    ? Math.floor((Date.now() - inProgressSince) / 3600000)
    : 0;
  const isStuck = hoursStuck >= 3;

  // Serviço já concluído sai da Home: o trabalho do técnico acabou e o valor
  // passa a estar nos Ganhos, em "Por receber", até o serviço fechar. A
  // avaliação do cliente é despoletada pelo socket de fecho, não por aqui.
  if (svc?.status === ServiceStatus.FINISHED) return null;

  return (
    <View className="px-5">
      <TouchableOpacity
        activeOpacity={0.9}
        // Abre o estado do serviço (onde estão as ações), não o mapa: poupa um toque
        // por serviço — do mapa ainda era preciso entrar no estado para avançar.
        onPress={() => router.navigate(`/(app)/(services)/(open)/status/${svc?.id}`)}
      >
        <LinearGradient
          colors={isStuck
            ? ['rgba(233,162,59,0.34)', 'rgba(233,162,59,0.10)']
            : ['rgba(250,187,91,0.30)', 'rgba(250,187,91,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: isStuck ? Colors.warning : 'rgba(250,187,91,0.55)',
            },
            cardShadow,
          ]}
        >
          <View className="p-4">
            {/* Estado + indicador ao vivo */}
            <View className="flex-row items-center mb-3">
              {ui.live && <View className="mr-2"><LiveDot /></View>}
              <CustomText size="extraSmall" boldness="bold" color="secondary" style={{ color: ui.color, letterSpacing: 1 }}>
                {ui.label.toUpperCase()}
              </CustomText>
            </View>

            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: ui.color }}
              >
                {ui.icon}
              </View>

              <View className="flex-1">
                <CustomText color="secondary" size="medium" boldness="bolder" numberOfLines={2}>
                  {svc?.service_type?.name}
                </CustomText>
                {!!price && (
                  <CustomText size="medium" color="secondary" boldness="bolder" classes="mt-0.5 opacity-90">
                    {price}
                  </CustomText>
                )}
              </View>

              <Feather name="chevron-right" size={22} color={Colors.brand} />
            </View>

            {/* Há quanto tempo está parado + o que fazer. Sem isto, o técnico
                não tinha como saber que o serviço ficou por fechar — e é isso
                que o impede de ser pago. */}
            {isStuck && (
              <View
                className="flex-row items-center mt-3 pt-3"
                style={{ borderTopWidth: 1, borderTopColor: 'rgba(233,162,59,0.4)' }}
              >
                <Feather name="alert-triangle" size={15} color={Colors.warning} />
                <CustomText size="small" color="secondary" boldness="semiBold" classes="ml-2 flex-1" numberOfLines={2}>
                  {t(hoursStuck >= 24 ? 'services.service.status.stuck.days' : 'services.service.status.stuck.hours', {
                    hours: hoursStuck,
                    days: Math.floor(hoursStuck / 24),
                  })}
                </CustomText>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

export default OpenService

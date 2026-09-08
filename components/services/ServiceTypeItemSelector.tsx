import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { CustomText } from "@/components/CustomText";
import { Colors } from "@/constants/Colors";
import { ServiceTypeInterface } from "@/types/services";
import { estimateVendorEarning, formatDuration, formatEuro } from "@/utils/services";

interface ServiceTypeItemSelectorProps {
  item: ServiceTypeInterface;
  isSelected: boolean;
  addServiceType: (serviceTypeId: number) => void;
  /** Tarifa horária do técnico — usada só para estimar o ganho quando há duração. */
  hourRate?: number | null;
}

/**
 * Linha de um tipo de serviço que o técnico liga ou desliga.
 *
 * A LINHA INTEIRA é o botão, e o estado mostra-se com um visto. Era um
 * `Switch`, que aqui dizia pouco: o manípulo branco sobre cinzento lê-se como
 * ligado, o alvo era uma pastilha de 50 px ao canto, e um interruptor é um
 * "ligar/desligar" quando o que se está a fazer é escolher itens de uma lista.
 * Selecionado ganha moldura âmbar e o visto preenchido — dá para ver o que já
 * está escolhido a percorrer a lista, sem ler.
 *
 * A duração e o ganho só aparecem quando o backend devolver `time` — ver utils/services.ts.
 */
const ServiceTypeItemSelector: React.FC<ServiceTypeItemSelectorProps> = ({
  item,
  isSelected,
  addServiceType,
  hourRate = null,
}) => {
  const duration = formatDuration(item.time);
  const earning = formatEuro(estimateVendorEarning(hourRate, item.time));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => addServiceType(item.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={item.name}
      className="w-full flex-row items-center justify-between rounded-2xl px-2 py-2"
      style={{
        backgroundColor: isSelected ? Colors.brand_soft : 'transparent',
        borderWidth: 1,
        borderColor: isSelected ? Colors.brand : 'transparent',
      }}
    >
      {/* A imagem do catálogo, a mesma que o cliente vê. Reconhecer o trabalho
          pelo desenho é mais rápido do que ler uma lista de 26 nomes que
          começam todos por "Reparação de" — e é assim que ele escolhe o que
          sabe fazer. Sem imagem no payload, a linha fica como estava. */}
      {!!item.image && (
        <Image
          source={{ uri: item.image }}
          style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }}
          contentFit="cover"
          transition={120}
        />
      )}
      <View className="flex-1 mr-3">
        <CustomText size="small" color="secondary" boldness="semiBold" numberOfLines={2}>
          {item.name}
        </CustomText>
        {(!!duration || !!earning) && (
          <View className="flex-row items-center mt-1">
            {!!duration && (
              <>
                <Feather name="clock" size={12} color={Colors.muted} />
                <CustomText color="muted" size="extraSmall" classes="ml-1.5 mr-3">
                  {duration}
                </CustomText>
              </>
            )}
            {!!earning && (
              <CustomText color="brand" size="extraSmall" boldness="bold">
                {earning}
              </CustomText>
            )}
          </View>
        )}
      </View>

      {/* Visto preenchido quando escolhido, círculo vazio quando não —
          o par cheio/vazio lê-se de relance, ao contrário de dois tons de
          cinzento num interruptor. */}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: 26,
          height: 26,
          backgroundColor: isSelected ? Colors.brand : 'transparent',
          borderWidth: isSelected ? 0 : 1.5,
          borderColor: Colors.line,
        }}
      >
        {isSelected && <Feather name="check" size={16} color={Colors.on_brand} />}
      </View>
    </TouchableOpacity>
  );
};

export default ServiceTypeItemSelector;

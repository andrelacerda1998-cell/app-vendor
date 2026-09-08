import React from "react";
import { Switch, View } from "react-native";
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
 * Linha de um tipo de serviço com switch de subscrição.
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
    <View className="w-full flex-row items-center justify-between">
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

      <Switch
        value={isSelected}
        onValueChange={() => addServiceType(item.id)}
        trackColor={{ false: Colors.card_high, true: Colors.brand }}
        thumbColor={Colors.secondary}
      />
    </View>
  );
};

export default ServiceTypeItemSelector;

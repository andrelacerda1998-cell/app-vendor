import React, { useState } from 'react';
import { View } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import TouchOpacity from '@/components/TouchOpacity';
import { Colors } from '@/constants/Colors';
import { Card, IconTile } from '@/components/ui';
import { CustomText } from "./CustomText";
import ServiceTypeItemSelector from "./services/ServiceTypeItemSelector";
import { ServiceTypeInterface } from "@/types/services";

type OperationAreaCardProps = {
  /** Opcional: sem ícone, a linha fica só com o nome da categoria e o contador. */
  Icon?: () => React.JSX.Element;
  label: string;
  onServiceTypePress: (serviceTypeId: number) => void;
  otherClasses?: string;
  servicesTypes?: ServiceTypeInterface[];
  selectedServicesTypes?: ServiceTypeInterface['id'][];
  /** Tarifa horária do técnico, para estimar o ganho por serviço. */
  hourRate?: number | null;
};

const OperationAreaCard = ({
  Icon,
  label,
  onServiceTypePress,
  otherClasses = '',
  servicesTypes,
  selectedServicesTypes,
  hourRate = null,
  ...props
}: OperationAreaCardProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const servicesSelected = servicesTypes?.filter(serviceType => selectedServicesTypes?.includes(serviceType.id)) || [];
  const hasSelection = servicesSelected.length > 0;

  return (
    // Categoria com escolhas feitas: borda âmbar. A distinção não fica dependente
    // só da cor do contador (quem não distingue bem cores continua a ver a diferença,
    // reforçada pela etiqueta em texto ao lado).
    <Card
      padded={false}
      style={hasSelection ? { borderColor: Colors.brand, borderTopColor: Colors.brand } : undefined}
    >
      <TouchOpacity
        otherClasses={`w-full flex-row items-center px-4 py-4 ${otherClasses}`}
        onPress={() => {
          setOpen(prev => !prev);
        }}
        {...props}
      >
        {Icon && (
          <IconTile>
            <Icon />
          </IconTile>
        )}
        <View className={`flex-1 ${Icon ? 'px-3' : 'pr-3'}`}>
          <CustomText
            boldness="semiBold"
            color="secondary"
            size="medium"
            numberOfLines={2}
          >
            {label}
          </CustomText>
          {/* Contador legível ("3 selecionados") em vez de um número solto. */}
          <CustomText
            color={hasSelection ? 'brand' : 'muted'}
            boldness="medium"
            size="small"
            classes="mt-1"
            numberOfLines={1}
          >
            {hasSelection
              ? t('operation_areas.services_types.selected_count', { count: servicesSelected.length })
              : t('operation_areas.services_types.none_selected')}
          </CustomText>
        </View>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.muted}
        />
      </TouchOpacity>

      {open && servicesTypes && selectedServicesTypes && (
        <View className="px-4 pb-4">
          <View style={{ height: 1, backgroundColor: Colors.line }} className="mb-3" />
          {servicesTypes.length > 0 ? servicesTypes.map((serviceType, index) => (
            <View key={serviceType.id} className="w-full">
              {index > 0 && (
                <View style={{ height: 1, backgroundColor: Colors.line }} className="my-3" />
              )}
              <ServiceTypeItemSelector
                item={serviceType}
                isSelected={selectedServicesTypes.includes(serviceType.id)}
                addServiceType={onServiceTypePress}
                hourRate={hourRate}
              />
            </View>
          )) : (
            <CustomText
              color="muted"
              classes="text-center"
              boldness="medium"
              size="small"
            >
              {t('operation_areas.services_types.empty')}
            </CustomText>
          )}
        </View>
      )}
    </Card>
  );
};

export default OperationAreaCard;

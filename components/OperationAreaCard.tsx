import TouchOpacity from '@/components/TouchOpacity';
import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { View } from 'react-native';
import { CustomText } from "./CustomText";
import { Entypo } from "@expo/vector-icons";
import ServiceTypeItemSelector from "./services/ServiceTypeItemSelector";
import { ServiceTypeInterface } from "@/types/services";

type OperationAreaCardProps = {
  Icon: () => React.JSX.Element;
  label: string;
  onServiceTypePress: (serviceTypeId: number) => void;
  otherClasses?: string;
  servicesTypes?: ServiceTypeInterface[];
  selectedServicesTypes?: ServiceTypeInterface['id'][];
};

const OperationAreaCard = ({
  Icon,
  label,
  onServiceTypePress,
  otherClasses = '',
  servicesTypes,
  selectedServicesTypes,
  ...props
}: OperationAreaCardProps) => {
  const [open, setOpen] = useState(false);

  const servicesSelected = servicesTypes?.filter(serviceType => selectedServicesTypes?.includes(serviceType.id)) || [];

  return (
    <View className="border border-gray_strong rounded-xl">
      <TouchOpacity
        className={`w-full flex flex-row items-center justify-between ${otherClasses}`}
        onPress={() => {
          setOpen(prev => !prev);
        }}
        {...props}
      >
        <View className="w-14 h-14 items-center justify-center">
          <Icon />
        </View>
        <View className="flex-1 pr-3">
          <CustomText
            boldness="semiBold"
            color="secondary"
            classes="flex-shrink"
            numberOfLines={2}
          >
            {label}
          </CustomText>
        </View>
        <CustomText
          color="gray_medium"
          classes="text-center"
          boldness="semiBold"
          size="medium"
        >
          {servicesSelected.length}
        </CustomText>
        <View className="w-14 h-14 items-center justify-center">
          {open ? (
            <Entypo name="chevron-up" size={24} color={Colors.gray_medium} />
          ) : (
            <Entypo name="chevron-down" size={24} color={Colors.gray_medium} />
          )}
        </View>
      </TouchOpacity>
      {open && servicesTypes && selectedServicesTypes && (
        <View className="p-5 pt-2 space-y-4">
          {servicesTypes.length > 0 ? servicesTypes.map((serviceType) => (
            <View key={serviceType.id} className="w-full">
              <ServiceTypeItemSelector
                item={serviceType}
                isSelected={selectedServicesTypes.includes(serviceType.id)}
                addServiceType={onServiceTypePress}
                t={(key: string) => key}
              />
            </View>
          )) : (
            <CustomText
              color="gray_medium"
              classes="text-center"
              boldness="semiBold"
              size="small"
            >
              No services types available
            </CustomText>
          )}
        </View>
      )}
    </View>
  );
};

export default OperationAreaCard;

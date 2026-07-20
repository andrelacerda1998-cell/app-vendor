import React from 'react';
import { View } from 'react-native';
import { CustomText } from "./CustomText";

type OperationAreaCardCounterProps = {
  Icon: () => React.JSX.Element;
  label: string;
  count: number;
};

const OperationAreaCardCounter = ({
  Icon,
  label,
  count,
  ...props
}: OperationAreaCardCounterProps) => {
  return (
    <View className="border border-gray_strong rounded-xl">
      <View
        className="w-full flex flex-row items-center justify-between"
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
        <View className="w-14 h-14 items-center justify-center">
          <CustomText
            color="gray_medium"
            classes="text-center"
            boldness="semiBold"
            size="medium"
          >
            {count}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

export default OperationAreaCardCounter;

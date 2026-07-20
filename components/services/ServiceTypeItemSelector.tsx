import { CustomText } from "@/components/CustomText";
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity";
import { ServiceTypeInterface } from "@/types/services";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Animated } from "react-native"

interface ServiceTypeItemSelectorProps {
  item: ServiceTypeInterface;
  isSelected: boolean;
  addServiceType: (serviceTypeId: number) => void;
  t: (key: string) => string;
}

const ServiceTypeItemSelector: React.FC<ServiceTypeItemSelectorProps> = ({ item, isSelected, addServiceType, t }) => {
  const toggleAnimation = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(toggleAnimation, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected, toggleAnimation]);

  return (
    <View className="w-fit">
      <CustomTouchableOpacity
        type="transparent"
        size="large"
        textBoldness="semiBold"
        classes="rounded-none text-start w-fit p-0 m-0"
        onPress={() => {
          addServiceType(item.id);
        }}
      >
        <View className="w-full flex-row justify-between items-center">
          <CustomText size="medium" color="secondary" boldness="bold" className="w-[80%] text-start" numberOfLines={2}>
            {item.name}
          </CustomText>

          <View className="w-[15%]">
            <View className="w-12 h-7">
              <View
                className={`${isSelected ? 'bg-support_primary' : 'bg-gray_strong'} w-full h-full rounded-full`}
              />
              <Animated.View
                className={`absolute top-1 h-5 w-5 ${isSelected ? 'bg-gray_strong' : 'bg-support_primary'} rounded-full items-center justify-center`}
                style={{
                  transform: [{
                    translateX: toggleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, 24]
                    })
                  }],
                }}
              >
                {/* {isSelected && (
                  <Entypo name="flash" size={18} color={Colors.strongest} />
                )} */}
              </Animated.View>
            </View>
          </View>
        </View>
      </CustomTouchableOpacity>
    </View>
  );
};

export default ServiceTypeItemSelector;
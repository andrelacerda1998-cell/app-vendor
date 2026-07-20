import { ThemedText } from '@/components/ThemedText';
import TouchOpacity from '@/components/TouchOpacity';
import { Colors } from '@/constants/Colors';
import React from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

const NextServiceCard = ({
  type,
  price,
  clientName,
  clientAvatarSrc,
  clientAvatarSource,
  clientAddress,
  clientInstructions,
  clientInstructionsDescription,
  onPress,
  ...props
}: {
  type: "urgent" | "imediate" | "scheduled";
  price: number;
  clientName: string;
  clientAvatarSrc: string;
  clientAvatarSource?: ImageSourcePropType;
  clientAddress: string;
  clientInstructions: string;
  clientInstructionsDescription: string;
  onPress: () => void;
}) => {
  return (
    <TouchableWithoutFeedback onPress={onPress} {...props}>
      <View className="bg-secondary rounded-xl p-5 w-full max-w-96 mt-5">
        <View className="flex flex-row justify-between items-center">
          <ThemedText type="small" color={Colors.secondary} className="max-w-[50%] font-poppins-medium bg-error rounded-lg px-2 py-1" numberOfLines={1}>
            {type.charAt(0).toUpperCase() + type.slice(1)} 
          </ThemedText>
          <ThemedText type="default" className="font-poppins-extrabold text-lg max-w-[40%]" color={Colors.primary} numberOfLines={1}>
            ${price}
          </ThemedText>
        </View>
        <View className="flex flex-row items-center justify-center w-full my-4">
          <Image
            source={clientAvatarSource || { uri: clientAvatarSrc }}
            className="w-12 h-12 rounded-full"
          />
          <View className="ml-4 w-[80%]">
            <ThemedText type="defaultSemiBold" color={Colors.primary} numberOfLines={1}>
              {clientName}
            </ThemedText>
            <ThemedText type="small" color={Colors.gray_medium} className="font-poppins-medium" numberOfLines={2}>
              {clientAddress}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="defaultSemiBold" color={Colors.primary} numberOfLines={1}>
          {clientInstructions}
        </ThemedText>
        <ThemedText type="small" color={Colors.gray_medium} numberOfLines={1}>
          {clientInstructionsDescription}
        </ThemedText>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default NextServiceCard

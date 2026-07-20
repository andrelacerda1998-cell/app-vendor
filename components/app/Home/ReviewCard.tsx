import { ThemedText } from '@/components/ThemedText'
import TouchOpacity from '@/components/TouchOpacity'
import { Colors } from '@/constants/Colors'
import { AntDesign, Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'

const ReviewCard = ({
  clientAvatarSrc,
  clientAvatarSource,
  clientName,
  clientsDescriptionGiven,
  clientStarsGiven,
  onPressCard,
  ...rest
}: {
  clientAvatarSrc: string,
  clientAvatarSource?: ImageSourcePropType,
  clientName: string,
  clientsDescriptionGiven: string,
  clientStarsGiven: string,
  onPressCard?: () => void,
}) => {
  return (
    <TouchOpacity
      otherClasses="border border-primary w-52 overflow-hidden rounded-xl h-44 p-5"
      onPress={onPressCard}
      {...rest}
    >
      <View className="relative flex flex-row items-center justify-between mb-4">
        <View className="h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={clientAvatarSrc}
            source={clientAvatarSource}
            className="w-full h-full object-cover object-center"
          />
        </View>
        <View className="flex-row items-center justify-end">
          <ThemedText
            type="smallSemiBold"
            color={Colors.primary}
            className="mr-2 max-w-[60%]"
            numberOfLines={1}
          >
            {clientStarsGiven}
          </ThemedText>
          <AntDesign name="star" size={24} color={Colors.support_primary} />
        </View>
      </View>
      <View>
        <ThemedText
          type="defaultSemiBold"
          color={Colors.primary}
          className=""
          numberOfLines={1}
        >
          {clientName}
        </ThemedText>
        <ThemedText
          type="small"
          color={Colors.gray_medium}
          className=""
          numberOfLines={3}
        >
          {clientsDescriptionGiven}
        </ThemedText>
      </View>
    </TouchOpacity>
  )
}

export default ReviewCard

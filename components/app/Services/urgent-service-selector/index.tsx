import { ThemedText } from '@/components/ThemedText'
import TouchOpacity from '@/components/TouchOpacity'
import { Colors } from '@/constants/Colors'
import React from 'react'
import { View } from 'react-native'

const UrgentServiceSelector = ({
  selected,
  Icon,
  label,
  onPress
}: {
  selected: boolean,
  Icon: () => JSX.Element,
  label: string,
  onPress?: () => void
}) => {
  return (
    <TouchOpacity className="w-16 flex items-center" onPress={onPress}>
      <View
        className={`
          ${selected ?
            "bg-support_primary" :
            "border border-gray_medium"
          }
          flex items-center justify-center h-16 w-16 p-2 rounded-lg
        `}
      >
        <Icon />
      </View>
      <ThemedText type="small" color={Colors.secondary} className="mt-2 font-poppins-medium text-center" numberOfLines={2}>
        {label}
      </ThemedText>
    </TouchOpacity>
  )
}

export default UrgentServiceSelector

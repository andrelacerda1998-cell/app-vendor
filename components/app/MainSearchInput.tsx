import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { TextInput, View } from 'react-native'

const MainSearchInput = () => {
  return (
    <View className="relative flex justify-center">
      <TouchableOpacity className="absolute right-2 bg-primary h-10 w-10 rounded-full flex items-center justify-center z-[1]">
        <Ionicons
          size={20}
          name="search-outline"
          color={Colors.support_primary}
        />
      </TouchableOpacity>
      <TextInput
        // {...field}
        keyboardType="web-search"
        // onChangeText={field.onChange}
        placeholder="what do you need?"
        placeholderTextColor={Colors.primary}
        className="rounded-full bg-secondary py-3 px-5 text-primary placeholder:text-primary text-sm font-poppins-regular pr-14"
      />
    </View>
  )
}

export default MainSearchInput

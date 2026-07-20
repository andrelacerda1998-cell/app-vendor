import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { Entypo, FontAwesome6, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import TouchOpacity from '@/components/TouchOpacity'
import BackHeader from '@/components/app/BackHeader'

const Start = () => {
  return (
    <SafeAreaView className="flex-1 bg-support_primary p-5">
      {/* <StatusBar backgroundColor={Colors.support_primary} animated /> */}

      <BackHeader
        backButtonColor="primary"
        middleItem={() => (
          <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
            Urgent Service
          </ThemedText>
        )}
        // onBack={onClose}
      />

      <ScrollView contentContainerStyle={{
        flexGrow: 1,
        width: "100%",
        justifyContent: "center",
        borderTopStartRadius: 30,
        borderTopEndRadius: 30,
      }}>
        <View className="flex-1 gap-10">
          <View>
            <ThemedText type="title" color={Colors.primary}>
              What Qualifies as an Urgent Service?
            </ThemedText>
            <ThemedText type="default" color={Colors.primary} className="mt-2">
              Urgent services are immediate interventions needed to resolve problems.
            </ThemedText>
          </View>
          <View>
            <View className="flex flex-row gap-3 items-center">
              <View className="w-8 flex items-center justify-center">
                <Ionicons size={32} name='heart-outline' color={Colors.primary} />
              </View>
              <View className="flex-1">
                <ThemedText type="defaultSemiBold" color={Colors.primary}>
                  Urgent service
                </ThemedText>
                <ThemedText type="small" color={Colors.primary}>
                  Choose the type of urgent service
                </ThemedText>
              </View>
            </View>
            <View className="flex flex-row gap-3 items-center mt-4">
              <View className="w-8 flex items-center justify-center">
                <Octicons size={28} name='bell' color={Colors.primary} />
              </View>
              <View className="flex-1">
                <ThemedText type="defaultSemiBold" color={Colors.primary}>
                  Professional
                </ThemedText>
                <ThemedText type="small" color={Colors.primary}>
                  Professional receive a notification with a countdown.
                </ThemedText>
              </View>
            </View>
            <View className="flex flex-row gap-3 items-center mt-4">
              <View className="w-8 flex items-center justify-center">
                <MaterialCommunityIcons name="clock-time-eight-outline" size={32} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <ThemedText type="defaultSemiBold" color={Colors.primary}>
                  Countdown
                </ThemedText>
                <ThemedText type="small" color={Colors.primary}>
                  The professional will have 20 seconds to accept your request
                </ThemedText>
              </View>
            </View>
            <View className="flex flex-row gap-3 items-center mt-4">
              <View className="w-8 flex items-center justify-center">
                <FontAwesome6 name="check" size={24} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <ThemedText type="defaultSemiBold" color={Colors.primary}>
                  A supplier accepts the job
                </ThemedText>
                <ThemedText type="small" color={Colors.primary}>
                  Congratulations, now you can solve your problem in a short time
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
        <TouchOpacity
            bgColor="primary"
            itemsCenter
            rounded="lg"
            otherClasses="py-4 mt-6"
            onPress={() => {
                // router.canGoBack() && router.back();
                // onClose();
                router.navigate('/(app)/(urgent-service)/service-selection');
            }}
        >
          <ThemedText type="defaultBold" color={Colors.support_primary}>
            Start
          </ThemedText>
        </TouchOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Start;
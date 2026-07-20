import { ThemedText } from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import { Entypo, Feather, FontAwesome6, Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, TouchableOpacity, View } from 'react-native'
import TouchOpacity from '@/components/TouchOpacity'
import BackHeader from '@/components/app/BackHeader'
import UrgentServiceSelector from '@/components/app/Services/urgent-service-selector'
import { Picker, PickerIOS } from '@react-native-picker/picker'

const ServiceSelection = () => {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.push('/(app)/(tabs)/home');
  }

  const otherItems = [
    { label: "Rupture of pipes", value: 10 },
    { label: "Clogging of pipes", value: 11 },
    { label: "Locked outside", value: 12 },
    { label: "Short circuits", value: 13 },
  ]

  const mainItems = [
    {
      id: 1,
      label: "Rupture of pipes",
      Icon: () => <Ionicons size={32} name='enter-sharp' color={
        selectedService === 1 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 2,
      label: "Clogging of pipes",
      Icon: () => <Ionicons size={32} name='flash' color={
        selectedService === 2 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 3,
      label: "Locked outside",
      Icon: () => <Ionicons size={32} name='accessibility' color={
        selectedService === 3 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 4,
      label: "Short circuits",
      Icon: () => <Ionicons size={32} name='analytics-sharp' color={
        selectedService === 4 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 5,
      label: "Rupture of pipes",
      Icon: () => <Ionicons size={32} name='arrow-back-circle' color={
        selectedService === 5 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 6,
      label: "Clogging of pipes",
      Icon: () => <Ionicons size={32} name='airplane-outline' color={
        selectedService === 6 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 7,
      label: "Locked outside",
      Icon: () => <Ionicons size={32} name='ban-sharp' color={
        selectedService === 7 ? Colors.primary : Colors.support_primary
      } />
    },
    {
      id: 8,
      label: "Short circuits",
      Icon: () => <Ionicons size={32} name='cart' color={
        selectedService === 8 ? Colors.primary : Colors.support_primary
      } />
    }
  ]

  return (
    <SafeAreaView className="flex-1 bg-support_primary">
      {/* <StatusBar backgroundColor={Colors.support_primary} animated /> */}

      <View className="p-5">
        <BackHeader
          backButtonColor="primary"
          middleItem={() => (
            <View className="flex flex-row items-center">
              <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
                R. Augusta, 25
              </ThemedText>
              <Entypo name="chevron-down" size={20} color={Colors.primary} />
            </View>
          )}
          // rigthItem={() => (
          //   <View className="flex items-end">
          //     <Feather name="help-circle" size={30} color={Colors.primary} />
          //   </View>
          // )}
          // onBack={onClose}
        />
      </View>

      <ScrollView contentContainerStyle={{
        flexGrow: 1,
        width: "100%",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        borderTopStartRadius: 30,
        borderTopEndRadius: 30,
        padding: 20,
      }}>
        <View className="flex-1 gap-10">
          <View>
            <ThemedText type="defaultBold" color={Colors.secondary} className="text-lg text-center">
              Urgent Service
            </ThemedText>
            <ThemedText type="default" color={Colors.gray_medium} className="mt-2 text-center px-8">
              After selecting the service, the professional will have 20 minutes to accept your request.
            </ThemedText>
          </View>
          <View>
            <ThemedText type="default" color={Colors.secondary}>
              Quick access
            </ThemedText>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 30,
                marginTop: 20,
              }}
            >
              {
                mainItems.map((item, index) => (
                  <UrgentServiceSelector
                    key={index}
                    selected={selectedService === item.id}
                    Icon={item.Icon}
                    label={item.label}
                    onPress={() => setSelectedService(item.id)}
                  />
                ))
              }
            </View>
          </View>
          <View
            className={`
              relative mt-2 border-2 border-gray_medium rounded-lg flex justify-center
            `}
          >
            <Picker
              selectedValue={selectedService}
              onValueChange={(value) => setSelectedService(value as number)}
              className={`
                border-2 rounded-lg py-3 px-5 text-gray_medium focus:border-support_primary text-sm font-poppins-regular h-14
              `}
              style={{
                borderColor: Colors.gray_medium,
                borderWidth: 2,
                borderRadius: 8,
                padding: 10,
                height: 50,
                color: Colors.secondary,
              }}
            >
              <Picker.Item label="Others" value={null} color={Colors.gray_medium} />
              {
                otherItems.map((item, index) => (
                  <Picker.Item
                    key={index}
                    label={item.label}
                    value={item.value}
                  />
                ))
              }
            </Picker>
            <View className="absolute right-4">
              <Ionicons name="chevron-down" size={24} color={Colors.support_primary} />
            </View>
          </View>
        </View>
        <TouchOpacity
            bgColor={selectedService === null ? "gray_medium" : "secondary"}
            itemsCenter
            rounded="lg"
            otherClasses="py-4 mt-6"
            onPress={() => {
              if (selectedService === null) {
                return;
              }

              router.navigate('/(app)/(urgent-service)/wait-accept');
            }}
            disabled={selectedService === null}
        >
          <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
            Request professional
          </ThemedText>
        </TouchOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ServiceSelection;
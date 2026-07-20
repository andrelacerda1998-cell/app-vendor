import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Entypo, Feather, FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import TouchOpacity from '@/components/TouchOpacity';
import BackHeader from '@/components/app/BackHeader';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const CIRCLE_LENGTH = 400; // Circumference of the circle
const R = CIRCLE_LENGTH / (2 * Math.PI); // Radius of the circle

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WaitAccept = () => {
  const [remainingTime, setRemainingTime] = useState(5); // 30 seconds
  const [status, setStatus] = useState<'pending' | 'timeout' | 'success'>('pending');

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: remainingTime * 1000,
      easing: Easing.linear,
    });

    // Update the remaining time every second
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(interval);
          setStatus("timeout");
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));

  const onClose = () => {
    if (router.canGoBack()) {
      return router.back();
    }
    return router.navigate('/(app)/(tabs)/home');
  };

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

      {
        status === "pending" && (
          <ScrollView contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            justifyContent: "center",
            backgroundColor: Colors.primary,
            borderTopStartRadius: 30,
            borderTopEndRadius: 30,
            padding: 20,
          }}>
            <View className="flex-1">
              <View className="flex-1 justify-center items-center">
                <Svg width={200} height={200} viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={R}
                    stroke="#333"
                    strokeWidth={10}
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <AnimatedCircle
                    cx="100"
                    cy="100"
                    r={R}
                    stroke={Colors.support_primary}
                    strokeWidth={10}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={CIRCLE_LENGTH}
                    animatedProps={animatedProps}
                    transform={`rotate(-90 100 100)`}
                  />
                </Svg>
                <View className="absolute">
                  <Ionicons
                    size={40}
                    name='flash'
                    color={Colors.gray_medium}
                  />
                </View>
              </View>

              <View>
                <ThemedText type="default" color={Colors.secondary} className="font-poppins-medium text-center">
                  Request professional
                </ThemedText>
                <ThemedText type="default" color={Colors.gray_medium} className="text-center my-2 px-5">
                  The professional has {remainingTime} seconds to accept your request
                </ThemedText>
              </View>
            </View>
            <TouchOpacity
                bgColor="secondary"
                itemsCenter
                rounded="lg"
                otherClasses="py-4 mt-6"
                onPress={() => {
                  onClose();
                }}
                // disabled={selectedService === null}
            >
              <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
                Cancel
              </ThemedText>
            </TouchOpacity>
          </ScrollView>
        )
      }
      {
        status === "timeout" && (
          <ScrollView contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            justifyContent: "center",
            backgroundColor: Colors.primary,
            borderTopStartRadius: 30,
            borderTopEndRadius: 30,
            padding: 20,
          }}>
            <View className="flex-1">
              <View className="flex-1 justify-center items-center">
                <Svg width={200} height={200} viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={R}
                    stroke={Colors.error}
                    strokeWidth={10}
                    fill="none"
                  />
                </Svg>
                <View className="absolute">
                  <MaterialCommunityIcons
                    name="window-close"
                    size={40}
                    color={Colors.gray_medium}
                  />
                </View>
              </View>

              <View>
                <ThemedText type="default" color={Colors.secondary} className="font-poppins-medium text-center">
                  Professional not found
                </ThemedText>
                <ThemedText type="default" color={Colors.gray_medium} className="text-center my-2 px-5">
                  Sorry, but we couldn't find any professionals within a 10km radius for you.
                </ThemedText>
              </View>
            </View>
            <TouchOpacity
                bgColor="secondary"
                itemsCenter
                rounded="lg"
                otherClasses="py-4 mt-6"
                onPress={() => {
                  onClose();
                }}
                // disabled={selectedService === null}
            >
              <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
                Try again
              </ThemedText>
            </TouchOpacity>
          </ScrollView>
        )
      }
      {
        status === "success" && (
          <ScrollView contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            justifyContent: "center",
            backgroundColor: Colors.primary,
            borderTopStartRadius: 30,
            borderTopEndRadius: 30,
            padding: 20,
          }}>
            <View className="flex-1">
              <View className="flex-1 justify-center items-center">
                <Svg width={200} height={200} viewBox="0 0 200 200">
                  {/* Background Circle */}
                  <Circle
                    cx="100"
                    cy="100"
                    r={R}
                    stroke="#FABB5B"
                    strokeWidth={10}
                    fill="none"
                  />
                </Svg>
                <View className="absolute">
                  <FontAwesome6
                    size={40}
                    name='check'
                    color={Colors.gray_medium}
                  />
                </View>
              </View>

              <View>
                <ThemedText type="default" color={Colors.secondary} className="font-poppins-medium text-center">
                  Professional accepted
                </ThemedText>
                <ThemedText type="default" color={Colors.gray_medium} className="text-center my-2 px-5">
                  The professional will be at your location shortly
                </ThemedText>
              </View>
            </View>
            <TouchOpacity
                bgColor="secondary"
                itemsCenter
                rounded="lg"
                otherClasses="py-4 mt-6"
                onPress={() => {
                  onClose();
                }}
                // disabled={selectedService === null}
            >
              <ThemedText type="defaultBold" color={Colors.primary} numberOfLines={1}>
                Cancel
              </ThemedText>
            </TouchOpacity>
          </ScrollView>
        )
      }
    </SafeAreaView>
  )
}

export default WaitAccept;

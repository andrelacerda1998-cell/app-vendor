import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, Modal } from 'react-native';
import { Redirect, SplashScreen, Stack, Tabs, useNavigation } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        // animationEnabled: true,
        animation: 'slide_from_bottom',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="order/index"
        options={{
          presentation: 'transparentModal',
          // animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />

      {/* <Stack.Screen
        name="start/index"
        options={{
          // presentation: 'modal',
          // animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="service-selection/index"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="wait-accept/index"
        options={{
          presentation: 'modal',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      /> */}
    </Stack>
  );
}
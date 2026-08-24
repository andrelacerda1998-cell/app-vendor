import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, Modal } from 'react-native';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
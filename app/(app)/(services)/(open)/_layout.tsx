import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View, Modal } from 'react-native';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(chat)"
      />
      <Stack.Screen
        name="progress/[serviceId]"
      />
      <Stack.Screen
        name="status/[serviceId]"
      />
      <Stack.Screen
        name="cancel/[serviceId]"
      />
    </Stack>
  );
}
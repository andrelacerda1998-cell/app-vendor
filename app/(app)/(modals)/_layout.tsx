import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(profile)"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="confirm-email"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="sms"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
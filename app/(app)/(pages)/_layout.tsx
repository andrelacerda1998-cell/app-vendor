import { Stack } from 'expo-router';


export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
 
      <Stack.Screen name="(userprofile)/userprofile" />

      <Stack.Screen name="(payments)/payments" />

      <Stack.Screen name="(settings)/settings" />

      <Stack.Screen name="(myservices)/myservices" />

    </Stack>
  );
}

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

      <Stack.Screen name="(support)/support" />

      <Stack.Screen name="(reviews)/reviews" />

      <Stack.Screen name="(mydocuments)/mydocuments" />

      <Stack.Screen name="(history)/history" />

      <Stack.Screen name="(notifications-settings)/notifications-settings" />

      <Stack.Screen name="(hourly-rate)/hourly-rate" />

      <Stack.Screen name="(account-status)/account-status" />

      <Stack.Screen name="(auto-acceptance)/auto-acceptance" />

    </Stack>
  );
}

import { Redirect, SplashScreen, Stack } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';


export default function AppLayout() {
  const { session, isLoading } = useSession();



  if (isLoading) {
    return SplashScreen.preventAutoHideAsync();
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(open)" />
      <Stack.Screen name="history/[serviceId]" />
    </Stack>
  );
}

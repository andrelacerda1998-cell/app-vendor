import { Text, View } from 'react-native';
import { Redirect, SplashScreen, Stack } from 'expo-router';
import { useSession } from '@/contexts/SessionContext';
import { useForceDarkTheme } from '@/contexts/ThemeContext';

export default function AppLayout() {
    // Entrar na app é sempre sobre preto: o ecrã foi desenhado assim (logo,
    // fundo e ilustrações) e não tem versão clara. A escolha do técnico volta
    // a valer assim que ele entra.
    useForceDarkTheme();

    const { session, isLoading } = useSession();

    // You can keep the splash screen open, or render a loading screen like we do here.
    if (isLoading) {
        return SplashScreen.preventAutoHideAsync();
    }

    SplashScreen.hideAsync();

    // Only require authentication within the (app) group's layout as users
    // need to be able to access the (auth) group and sign in again.
    if (session) {
        // On web, static rendering will stop here as the user is not authenticated
        // in the headless Node process that the pages are rendered in.
        return <Redirect href="/(app)/(tabs)/home" />;
    }

    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen
                name="index"
                options={{
                    animation: "fade_from_bottom"
                }}
            />
            <Stack.Screen
                name="signup/index"
                options={{
                    animation: "fade_from_bottom"
                }}
            />
            <Stack.Screen
                name="forgot-password/index"
                options={{
                    animation: "fade_from_bottom"
                }}
            />
        </Stack>
    );
    // This layout can be deferred because it's not the root layout.
}

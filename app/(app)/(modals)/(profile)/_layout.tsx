import {Stack} from 'expo-router';
import Dialog from '@/components/Dialog';

export default function AppLayout() {
    return (
        <>
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="edit-profile"
            />
            <Stack.Screen
                name="delete-account"
            />
        </Stack>
        {/* Anfitrião do diálogo para os ecrãs deste modal. O da raiz não consegue
          aparecer por cima de um modal -- ver a pilha em DialogContext. */}
        <Dialog />
        </>
    );
}

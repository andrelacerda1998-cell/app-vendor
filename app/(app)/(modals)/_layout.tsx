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
      {/*
        Pedido a chegar: ocupa o ecrã todo e NÃO pode ser descartado por gesto —
        o profissional tem de aceitar, recusar, ou deixar expirar.
      */}
      <Stack.Screen
        name="incoming-request/[serviceId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      {/* O convite de selecao fecha-se ao gesto, ao contrario do pedido
          direto: dizer que se esta disponivel nao e ficar com o trabalho, por
          isso nao ha nada a perder por o fechar. */}
      <Stack.Screen
        name="matching-invitation/[candidateId]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
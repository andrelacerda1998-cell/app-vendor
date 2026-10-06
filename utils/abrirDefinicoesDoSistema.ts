import { Linking, Platform } from 'react-native';

/**
 * Abre as definições desta app no sistema.
 *
 * Uma app não consegue ligar nem desligar as suas próprias permissões de
 * localização e notificações: depois de concedidas ou recusadas, só o próprio
 * utilizador as muda, nas Definições do telemóvel. O máximo que a app pode
 * fazer é levá-lo lá direto.
 */
export const abrirDefinicoesDoSistema = () => {
    if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:').catch(() => {});
    } else {
        Linking.openSettings().catch(() => {});
    }
};

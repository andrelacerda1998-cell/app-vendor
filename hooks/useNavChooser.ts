/**
 * Seletor de app de navegação — a ÚNICA porta para abrir mapas na app.
 *
 * Regra de produto: só Apple Maps (iOS), Google Maps e Waze. Nada de
 * Citymapper, Moovit, Uber e companhia. Antes havia duas portas: o ecra de
 * estado ja usava esta lista curta, mas o mapa a bordo abria o
 * `react-native-map-link`, que oferece uma lista longa e incontrolavel. Ter um
 * so sitio a decidir as apps e o que garante o "apenas e somente estas tres".
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useActionSheet } from '@expo/react-native-action-sheet';

import { navApps, openNavigation, type Coords } from '@/utils/fieldActions';

export const useNavChooser = () => {
  const { t } = useTranslation();
  const { showActionSheetWithOptions } = useActionSheet();

  /**
   * Abre o seletor das apps de navegação e lança a escolhida com o destino
   * preenchido. `onPick` recebe a app escolhida (para telemetria).
   */
  return useCallback(
    (coords?: Coords | null, addressLabel?: string | null, onPick?: (app: string) => void) => {
      const apps = navApps();
      const labels = apps.map((a) => t(`services.service.status.nav_apps.${a}`));

      showActionSheetWithOptions(
        {
          options: [...labels, t('general.cancel')],
          cancelButtonIndex: labels.length,
          title: t('services.service.status.navigate_with'),
        },
        (index?: number) => {
          if (index == null || index >= apps.length) return;
          onPick?.(apps[index]);
          openNavigation(apps[index], coords, addressLabel);
        },
      );
    },
    [showActionSheetWithOptions, t],
  );
};

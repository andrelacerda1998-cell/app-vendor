import { NativeModules, Platform } from 'react-native';
import { useEffect } from 'react';
import { useService } from '@/contexts/ServiceContext';
// @ts-ignore
import KeepAwake from 'react-native-keep-awake';


const { ForegroundService, NotificationModule  } = NativeModules;

export function useAndroidForegroundService() {
  const { activeService } = useService();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    if (!ForegroundService) {
      console.warn('ForegroundService module is not available yet');
      return;
    }

    if (activeService) {
      //opens the foreground service
      ForegroundService.start();

       //If there is an open service, the screen should not hibernate,
       //so we call KeepAwake.activate();

      KeepAwake.activate();

      NotificationModule?.showNotification('App Ativa', 'Serviço em execução');
    } else {
      //Closes the foreground service
      ForegroundService.stop();

      //in this case, there is no need of having the screen always awake:
      KeepAwake.deactivate();
      NotificationModule?.hideNotification?.();

    }

    return () => {
      if (ForegroundService) {
        //Closes the foreground service
        ForegroundService.stop();
      }

      //in this case, there is no need of having the screen always awake:
      KeepAwake.deactivate();
      NotificationModule?.hideNotification?.();
    };
  }, [activeService]);
}

import { useCallback, useEffect } from "react";

/**
 * Som de alerta para quando chega trabalho novo.
 *
 * Porquê: a push já toca som com a app fechada, mas com a app ABERTA o pedido
 * chegava pelo socket em silêncio — só vibração. Um técnico com o telemóvel na
 * bancada, a trabalhar, não vê o ecrã acender; e um pedido que ele não ouve é
 * um pedido perdido para ele e um cliente à espera do outro lado.
 *
 * O som toca mesmo com o telefone em silencioso (`playsInSilentModeIOS`): quem
 * está a trabalhar tem o toque desligado quase sempre, e este alerta é a razão
 * de a app estar aberta. A vibração continua a existir em paralelo, para quem
 * tem o volume no mínimo.
 *
 * `expo-av` é um módulo NATIVO: uma build que ainda não o tenha embutido não
 * consegue carregá-lo. Em vez de rebentar o ecrã de um pedido a chegar — o pior
 * momento possível para um crash —, falha em silêncio e fica só a vibração.
 */

type SoundLike = {
  replayAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
};

let cachedSound: SoundLike | null = null;
let loading: Promise<SoundLike | null> | null = null;
/** Módulo em falta ou ficheiro ilegível: não vale a pena tentar a cada pedido. */
let unavailable = false;

const loadSound = async (): Promise<SoundLike | null> => {
  if (cachedSound || unavailable) return cachedSound;
  if (loading) return loading;

  loading = (async () => {
    try {
      // require e não import: com o módulo ausente da build, um import estático
      // rebentaria o bundle inteiro em vez de só este som.
      const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = require("expo-av");

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        // Não cortamos o que o técnico esteja a ouvir (rádio, navegação):
        // baixamos o volume durante o alerta e devolvemo-lo a seguir.
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/new-request.wav"),
        { volume: 1 },
      );

      cachedSound = sound as SoundLike;
      return cachedSound;
    } catch (error) {
      unavailable = true;
      console.warn("[useAlertSound] som indisponível, fica só a vibração:", error);
      return null;
    } finally {
      loading = null;
    }
  })();

  return loading;
};

/**
 * Toca o alerta uma vez. Nunca rejeita: é chamada no ecrã de um pedido a
 * chegar, e um alerta que falha não pode levar o ecrã atrás.
 */
export const playAlertSound = async (): Promise<void> => {
  const sound = await loadSound();
  if (!sound) return;

  try {
    // replay e não play: um segundo pedido a chegar com o som ainda a tocar
    // tem de o reiniciar, senão não se ouve nada.
    await sound.replayAsync();
  } catch (error) {
    console.warn("[useAlertSound] falha ao tocar:", error);
  }
};

/**
 * O som é carregado uma só vez e reutilizado: carregá-lo no momento em que o
 * pedido chega dava um atraso de centenas de milissegundos, precisamente
 * quando cada segundo do contador conta.
 */
export const useAlertSound = () => {
  useEffect(() => {
    // Pré-carregar à entrada do ecrã para o primeiro toque ser imediato.
    void loadSound();
  }, []);

  return useCallback(playAlertSound, []);
};

export default useAlertSound;

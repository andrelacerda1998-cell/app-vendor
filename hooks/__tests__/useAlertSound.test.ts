/**
 * O que importa neste hook não é o som — é NÃO rebentar.
 *
 * Ele é chamado no ecrã de um pedido a chegar, o pior momento possível para um
 * crash: o técnico tem 60 segundos para aceitar e o ecrã tem de aparecer mesmo
 * que o áudio falhe (build sem o módulo nativo, ficheiro ilegível, telefone
 * sem canal de áudio disponível).
 */

const replayAsync = jest.fn().mockResolvedValue(undefined);

describe("useAlertSound", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("toca o alerta quando o áudio está disponível", async () => {
    jest.doMock(
      "expo-av",
      () => ({
        InterruptionModeIOS: { DuckOthers: 1 },
        InterruptionModeAndroid: { DuckOthers: 1 },
        Audio: {
          setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
          Sound: {
            createAsync: jest.fn().mockResolvedValue({
              sound: { replayAsync, unloadAsync: jest.fn() },
            }),
          },
        },
      }),
      { virtual: true },
    );

    const { playAlertSound } = require("@/hooks/useAlertSound");

    await playAlertSound();

    expect(replayAsync).toHaveBeenCalledTimes(1);
  });

  it("não rebenta quando o módulo nativo não existe na build", async () => {
    jest.doMock(
      "expo-av",
      () => {
        throw new Error("expo-av não está nesta build");
      },
      { virtual: true },
    );

    const { playAlertSound } = require("@/hooks/useAlertSound");

    await expect(playAlertSound()).resolves.toBeUndefined();
  });

  it("não rebenta quando a reprodução falha a meio", async () => {
    jest.doMock(
      "expo-av",
      () => ({
        InterruptionModeIOS: { DuckOthers: 1 },
        InterruptionModeAndroid: { DuckOthers: 1 },
        Audio: {
          setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
          Sound: {
            createAsync: jest.fn().mockResolvedValue({
              sound: {
                replayAsync: jest.fn().mockRejectedValue(new Error("sem canal de áudio")),
                unloadAsync: jest.fn(),
              },
            }),
          },
        },
      }),
      { virtual: true },
    );

    const { playAlertSound } = require("@/hooks/useAlertSound");

    await expect(playAlertSound()).resolves.toBeUndefined();
  });
});

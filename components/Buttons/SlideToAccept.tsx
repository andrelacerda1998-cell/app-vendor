import React, { useCallback, useState } from "react";
import { View, Vibration, LayoutChangeEvent, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { CustomText } from "@/components/CustomText";
import { Colors } from "@/constants/Colors";

const TRACK_HEIGHT = 60;
const THUMB_SIZE = 52;
const PAD = 4;
/** Fração do curso a partir da qual se considera confirmado (igual ao Flutter). */
const CONFIRM_AT = 0.85;

/**
 * "Deslizar para aceitar" — paridade com lib/widgets/slide_to_confirm.dart.
 * Evita aceites acidentais (telemóvel no bolso) exigindo um arrasto deliberado.
 *
 * Nota: `expo-haptics` não está instalado neste projeto, por isso o feedback
 * usa `Vibration` do react-native.
 */
const SlideToAccept = ({
  label,
  onConfirm,
  disabled = false,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const [busy, setBusy] = useState(false);

  const maxX = Math.max(0, trackWidth - THUMB_SIZE - PAD * 2);
  const dragX = useSharedValue(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const confirm = useCallback(() => {
    if (busy) return;
    setBusy(true);
    Vibration.vibrate(30);
    onConfirm();
  }, [busy, onConfirm]);

  const reset = useCallback(() => {
    dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [dragX]);

  const pan = Gesture.Pan()
    .enabled(!disabled && !busy && maxX > 0)
    .activeOffsetX([-10, 10])
    .onChange((e) => {
      const next = dragX.value + e.changeX;
      dragX.value = Math.min(maxX, Math.max(0, next));
    })
    .onEnd(() => {
      if (dragX.value >= maxX * CONFIRM_AT) {
        dragX.value = withTiming(maxX, { duration: 120 });
        runOnJS(confirm)();
      } else {
        dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const progress = useDerivedValue(() => (maxX <= 0 ? 0 : dragX.value / maxX));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: dragX.value + THUMB_SIZE + PAD * 2,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - progress.value * 1.4)),
  }));

  return (
    <View
      onLayout={onLayout}
      style={{
        height: TRACK_HEIGHT,
        width: "100%",
        borderRadius: TRACK_HEIGHT / 2,
        borderWidth: 1,
        borderColor: `${Colors.brand}66`,
        backgroundColor: `${Colors.brand}29`,
        justifyContent: "center",
        overflow: "hidden",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Preenchimento âmbar que acompanha o thumb. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: `${Colors.brand}2E`,
          },
          fillStyle,
        ]}
      />

      {/* Rótulo, que se apaga à medida que arrasta. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", left: 0, right: 0, alignItems: "center" },
          labelStyle,
        ]}
      >
        <CustomText color="secondary" boldness="bold" size="medium" numberOfLines={1}>
          {label}
        </CustomText>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: PAD,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: Colors.support_primary,
              alignItems: "center",
              justifyContent: "center",
            },
            thumbStyle,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.on_brand} />
          ) : (
            <Feather name="chevron-right" size={24} color={Colors.on_brand} />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default SlideToAccept;

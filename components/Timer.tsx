import { Colors } from "@/constants/Colors";
import { useApi } from "@/contexts/ApiContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from 'react'
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg"
import { CustomText } from "./CustomText";
import BackgroundTimer from 'react-native-background-timer';
import { useService } from "@/contexts/ServiceContext";
import { useTranslation } from "react-i18next";
import { useAppStateStatus } from "@/contexts/AppStateStatusContext";

const CIRCLE_LENGTH = 400; // Circumference of the circle
const R = CIRCLE_LENGTH / (2 * Math.PI); // Radius of the circle
const TIME_TO_WAIT_FOR_VENDOR = 60; // Time in seconds

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const Timer = ({
  onTimeout,
  durationSeconds = TIME_TO_WAIT_FOR_VENDOR,
  startedAtMs,
}: {
  onTimeout: () => void;
  durationSeconds?: number;
  startedAtMs?: number;
}) => {
  const { t } = useTranslation();
  const { pendingService } = useService();
  const progress = useSharedValue(0);
  const { appStateStatus } = useAppStateStatus();

  const serverNow = !startedAtMs && (pendingService?.server_time || pendingService?.updated_at)
    ? new Date((pendingService?.server_time || pendingService?.updated_at) as string).getTime()
    : null;
  const deviceNow = Date.now();
  const [clockOffset, setClockOffset] = useState(
    Number.isFinite(serverNow) ? (serverNow as number) - deviceNow : 0
  );
  const fallbackStartAtMsRef = useRef<number | null>(null);
  if (fallbackStartAtMsRef.current === null) {
    fallbackStartAtMsRef.current = Date.now();
  }
  const parsedUpdatedAt = pendingService?.updated_at
    ? new Date(pendingService?.updated_at as string).getTime()
    : null;
  const effectiveStartAtMs = startedAtMs
    ?? (Number.isFinite(parsedUpdatedAt) ? parsedUpdatedAt : null)
    ?? fallbackStartAtMsRef.current;
  const getInitialTime = () => {
    if (!Number.isFinite(effectiveStartAtMs)) return durationSeconds;
    const now = Date.now() + clockOffset;
    return Math.max(
      0,
      Math.min(
        durationSeconds,
        Math.floor((effectiveStartAtMs + durationSeconds * 1000 - now) / 1000)
      )
    );
  };
  const [remainingTime, setRemainingTime] = useState(getInitialTime());

  useEffect(() => {
    if (startedAtMs) {
      setClockOffset(0);
      return;
    }
    if (!Number.isFinite(serverNow)) return;
    setClockOffset((serverNow as number) - Date.now());
  }, [startedAtMs, serverNow]);

  useEffect(() => {
    setRemainingTime(getInitialTime());
  }, [clockOffset, durationSeconds, effectiveStartAtMs]);

  useEffect(() => {
    if (!Number.isFinite(remainingTime)) return;
    if (remainingTime <= 0) {
      onTimeout();
    }
    if (durationSeconds > 0) {
      progress.value = withTiming(remainingTime / durationSeconds, { duration: 500 });
    }
  }, [durationSeconds, onTimeout, progress, remainingTime])

  useEffect(() => {
    if (appStateStatus === "active") {
      setRemainingTime(getInitialTime());

      BackgroundTimer.runBackgroundTimer(() => {
        setRemainingTime(prev => {
          const next = getInitialTime();
          if (next <= 0) {
            BackgroundTimer.stopBackgroundTimer();
            return 0;
          }
          return next;
        });
      }, 1000);

      return () => {
        BackgroundTimer.stopBackgroundTimer();
      };
    }
  }, [appStateStatus, clockOffset, durationSeconds, effectiveStartAtMs]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));

  const renderRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  }

  return (
    <View className="flex-1 justify-center">
      <View className="justify-center items-center">
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Background Circle */}
          <Circle
            cx="100"
            cy="100"
            r={R}
            stroke="#333"
            strokeWidth={10}
            fill="none"
          />
          {/* Progress Circle */}
          <AnimatedCircle
            cx="100"
            cy="100"
            r={R}
            stroke={Colors.support_primary}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCLE_LENGTH}
            animatedProps={animatedProps}
            transform={`rotate(-90 100 100)`}
          />
        </Svg>
        <View className="absolute">
          <Ionicons
            size={40}
            name='flash'
            color={Colors.support_primary}
          />
        </View>
      </View>
      <CustomText color="gray_light">
        {t('services.wait_accept.pending.professional_has')} {renderRemainingTime()} {t('services.wait_accept.pending.to_accept')}
      </CustomText>
    </View>
  )
}

export default Timer

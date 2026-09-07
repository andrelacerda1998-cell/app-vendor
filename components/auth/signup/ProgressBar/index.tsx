import React from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ProgressBarProps {
  percentage: number;
}

function ProgressBar({ percentage = 0 }: ProgressBarProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <View className="w-full h-[6px] rounded-full overflow-hidden mb-4" style={{ backgroundColor: Colors.card_high }}>
      <View
        className="h-full rounded-full"
        style={{ width: `${clampedPercentage}%`, backgroundColor: Colors.support_primary }}
      />
    </View>
  );
}

export default ProgressBar;
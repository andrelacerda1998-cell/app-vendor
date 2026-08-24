import { Colors } from '@/constants/Colors';
import React, { forwardRef } from 'react'
import { TouchableOpacity } from 'react-native'
import { View } from 'react-native';
import { CustomText, type CustomTextBoldness, type CustomTextColor, type CustomFontSize } from '@/components/CustomText';

type CustomTouchableOpacityType =
  "primary" |
  "secondary" |
  "support_primary" |
  "support_secondary" |
  "primary_outline" |
  "secondary_outline" |
  "support_primary_outline" |
  "support_secondary_outline" |
  "gray_strong_outline" |
  "transparent" |
  "danger" |
  "danger_outline" |
  "strongest" |
  "success";
type CustomTouchableOpacitySize = "large" | "medium" | "small";


interface CustomTouchableOpacityProps {
  children?: React.ReactNode;
  type: CustomTouchableOpacityType;
  size: CustomTouchableOpacitySize;
  onPress?: () => void;
  classes?: string;
  itemsCenter?: boolean;
  Icon?: React.ComponentType;
  text: string;
  textSize: CustomFontSize;
  textColor: CustomTextColor;
  textBoldness: CustomTextBoldness;
  textNumberOfLines?: number;
  disabled?: boolean;
  textClasses?: string;
  [key: string]: any;
}

const CustomTouchableOpacity = forwardRef<any, CustomTouchableOpacityProps>(({
  children,
  type = "primary",
  size = "medium",
  onPress = undefined,
  classes,
  itemsCenter = true,
  Icon = null,
  text,
  textSize,
  textColor,
  textBoldness,
  textNumberOfLines = 1,
  disabled,
  textClasses,
  ...props
}, ref) => {
  const backgroundColor = () => {
    switch (type) {
      case "primary":
        return Colors.primary;
      case "secondary":
        return Colors.secondary;
      case "support_primary":
        return Colors.support_primary;
      case "support_secondary":
        return Colors.support_secondary;
      case "danger":
        return Colors.error;
      case "success":
        return Colors.success;
      case "strongest":
        return Colors.strongest;
      case "primary_outline":
      case "secondary_outline":
      case "support_primary_outline":
      case "support_secondary_outline":
      case "gray_strong_outline":
      case "danger_outline":
      case "transparent":
        return "transparent";
      default:
        return Colors.primary;
    }
  };

  const borderRadius = () => {
    switch (size) {
      case "large":
      case "medium":
        return 10;
      case "small":
        return 999;
      default:
        return 8;
    }
  };

  const borderColor = () => {
    switch (type) {
      case "primary":
        return Colors.primary;
      case "secondary":
        return Colors.secondary;
      case "support_primary":
        return Colors.support_primary;
      case "support_secondary":
        return Colors.support_secondary;
      case "success":
        return Colors.success;
      case "primary_outline":
        return Colors.primary;
      case "secondary_outline":
        return Colors.secondary;
      case "support_primary_outline":
        return Colors.support_primary;
      case "support_secondary_outline":
        return Colors.support_secondary;
      case "gray_strong_outline":
        return Colors.gray_strong;
      case "danger_outline":
        return Colors.error;
      default:
        return "transparent";
    }
  };

  const padding = () => {
    switch (size) {
      case "large":
        return 18;
      case "medium":
        return 14;
      case "small":
        return 8;
      default:
        return 12;
    }
  }

  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: backgroundColor(),
          borderRadius: borderRadius(),
          borderColor: borderColor(),
          borderWidth: 1,
          paddingHorizontal: padding(),
          paddingVertical: padding(),
          alignItems: itemsCenter ? 'center' : 'flex-start',
          justifyContent: itemsCenter ? 'center' : 'flex-start',
          flexDirection: 'row',
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      className={classes}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      {...props}
    >
      {Icon && <View className="mr-2"><Icon /></View>}
      <CustomText size={textSize} color={textColor} boldness={textBoldness} numberOfLines={textNumberOfLines} classes={textClasses}>
        {text}
      </CustomText>
      {children && children}
    </TouchableOpacity>
  )
})

export default CustomTouchableOpacity

import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { FontAwesome } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { CustomText } from "./CustomText";
import CheckMark from "@/assets/icons/check-mark";

interface CheckboxProps {
  size?: "small" | "medium" | "large";
  label: string;
  checked: boolean;
  onChange: () => void;
  touchableClasses?: string;
  labelClasses?: string;
  labelColor?: keyof typeof Colors;
  checkMarkColor?: keyof typeof Colors;
  checkedColor?: keyof typeof Colors;
  uncheckedBorderColor?: keyof typeof Colors;
  unCheckedBackgroundColor?: keyof typeof Colors;
}

const Checkbox = ({
  size = "medium",
  label,
  checked,
  onChange,
  touchableClasses,
  labelColor = 'secondary',
  labelClasses,
  checkMarkColor = 'primary',
  checkedColor = 'support_primary',
  uncheckedBorderColor = 'gray_medium',
  unCheckedBackgroundColor = 'gray_strong',
  ...props
}: CheckboxProps) => {
  const checkSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "medium":
        return 24;
      case "large":
        return 32;
      default:
        return 24;
    }
  }

  return (
    <TouchableOpacity
      className={`flex-row items-center ${touchableClasses}`}
      onPress={onChange}
      {...props}
    >
      <View
        style={{
          width: checkSize(),
          height: checkSize(),
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
          backgroundColor: checked ? Colors[checkedColor] : Colors[unCheckedBackgroundColor],
          borderWidth: 1,
          borderColor: checked ? Colors[checkedColor] : Colors[uncheckedBorderColor],
        }}
      >
        {checked && (
          <View className="w-3 h-3">
            <CheckMark thickness={3} color={Colors[checkMarkColor]} />
          </View>
          // <FontAwesome name="check" size={14} color={Colors[checkMarkColor]} />
        )}
      </View>
      <CustomText color={labelColor} numberOfLines={1} classes={labelClasses}>
        {label}
      </CustomText>
    </TouchableOpacity>
  );
};

export default Checkbox;
import TouchOpacity from "@/components/TouchOpacity";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {Colors} from "@/constants/Colors";
import {CustomText} from "@/components/CustomText";
import React from "react";

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchOpacity
    onPress={onPress}
    rounded="lg"
    itemsCenter
    otherClasses="px-5 py-2 flex-row space-x-2 mr-2"
    bgColor={active ? "support_primary" : null}
    border
    borderColor={active ? "support_primary" : "gray_strong"}
  >
    <MaterialCommunityIcons
      name="flash"
      size={16}
      color={active ? Colors.strongest : Colors.support_primary}
      style={{ marginTop: 1 }}
    />
    <CustomText
      color={active ? "primary" : "secondary"}
      boldness="semiBold"
      size="small"
    >
      {label}
    </CustomText>
  </TouchOpacity>
);

export default FilterChip;
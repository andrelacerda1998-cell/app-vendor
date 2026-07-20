import React from "react";
import Svg, { Path } from "react-native-svg";

const ToolIcon = ({ size = 32, color = "black" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M14.7 6.3a5 5 0 0 1-6.4 6.4l-4.3 4.3a2 2 0 1 0 2.8 2.8l4.3-4.3a5 5 0 0 1 6.4-6.4l2.6-2.6a2 2 0 0 0-2.8-2.8l-2.6 2.6z" />
  </Svg>
);

export default ToolIcon;
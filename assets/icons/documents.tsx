import React from "react";
import Svg, { Path, Rect, Polyline } from "react-native-svg";

const DocumentIcon = ({ size = 32, color = "black" }) => (
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
    
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    
    
    <Polyline points="14 2 14 8 20 8" />
  </Svg>
);

export default DocumentIcon;
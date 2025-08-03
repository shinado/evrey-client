import React from "react";
import { View, ViewStyle } from "react-native";
import { Theme } from "../constants/Theme";

interface DividerProps {
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({ style }) => (
  <View
    style={[
      {
        height: 1,
        backgroundColor: Theme.secondaryColors[200],
        width: "100%",
      },
      style,
    ]}
  />
);

export default Divider;

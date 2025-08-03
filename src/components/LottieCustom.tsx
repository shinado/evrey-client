import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";

const LottieCustom = ({
  uri,
  style,
  autoPlay = true,
  loop = true
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean
}) => {
  return (
    <LottieView source={uri} autoPlay={autoPlay} loop={loop} style={style} />
  );
};

export default LottieCustom;

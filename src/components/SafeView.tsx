import React, { ReactNode, FC, ComponentType } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyStore } from "../stores/store";

interface SafeViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  [key: string]: any; // for additional props
}

const SafeScreenView: FC<SafeViewProps> = ({ children, style, ...props }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ paddingTop: insets.top, backgroundColor: "white" }, style]} {...props}>
      {children}
    </View>
  );
};

function wrapWithSafeScreenView<P>(
  WrappedComponent: ComponentType<P>,
  style: StyleProp<ViewStyle> = null
) {
  const ComponentWithSafeView: React.FC<P> = (props) => {
    return (
      <SafeScreenView style={[styles.safeScreenViewContainer, style]}>
        {/* @ts-ignore */}
        <WrappedComponent {...props} />
      </SafeScreenView>
    );
  };

  // Optionally set display name for better debugging
  ComponentWithSafeView.displayName = `WithSafeView(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithSafeView;
}

const useMySafeBottom = (isInTab: boolean) => {
  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = useMyStore((state) => state.bottomTabBarHeight);
  const safeBottom = Math.max(insets.bottom, isInTab ? bottomTabBarHeight : 0) + 16;

  return safeBottom;
};

const useMySafeTop = () => {
  const insets = useSafeAreaInsets();
  return insets.top;
};

const styles = {
  safeScreenViewContainer: {
    flex: 1,
  },
};

export default wrapWithSafeScreenView;
export { SafeScreenView, useMySafeBottom, useMySafeTop };

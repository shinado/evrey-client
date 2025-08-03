import {
  ColorValue,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {Theme} from './Theme';

const circularView = (
  size: number,
  color: ColorValue | undefined,
): StyleProp<ViewStyle> => ({
  width: size,
  height: size,
  borderRadius: size / 2,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color,
});

const centerView = (size: number): StyleProp<ViewStyle> => ({
  width: size,
  height: size,
  justifyContent: 'center',
  alignItems: 'center',
});

const horizontalView: StyleProp<ViewStyle> = {
  flexDirection: 'row',
  alignItems: 'center',
};

const horizontalWithFlex: StyleProp<ViewStyle> = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
};

const simpleFlex: StyleProp<ViewStyle> = {
  flex: 1,
};

const screenSubTitle: StyleProp<TextStyle> = {
  fontWeight: 'bold',
  fontSize: 18,
  color: Theme.secondaryColors[900],
  flex: 1,
  paddingLeft: 16,
};

const actionBarMiddleTitle: StyleProp<TextStyle> = {
  fontWeight: 'bold',
  fontSize: 16,
  color: Theme.secondaryColors[900],
  textAlign: 'center',
};

const modalOptionsButton: StyleProp<ViewStyle> = {
  backgroundColor: Theme.secondaryColors[100],
  alignItems: 'center',
  justifyContent: 'center',
  margin: 16,
  padding: 8,
};

const modalOptionsButtonText = {
  fontSize: 14,
  textAlign: 'left',
  padding: 8,
  color: Theme.secondaryColors[900],
};

const shadow: StyleProp<ViewStyle> = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  zIndex: 1,
  elevation: 5,
};

const redDot: StyleProp<ViewStyle> = {
  // Style for the red dot
  height: 10,
  width: 10,
  borderRadius: 5,
  backgroundColor: 'red',
  position: 'absolute',
  right: 16,
  alignSelf: 'center',
  zIndex: 1,
  elevation: 2,
};

export const MyStyleSheet = {
  horizontalWithFlex: horizontalWithFlex,
  simpleFlex: simpleFlex,
  shadow: shadow,
};

export const StyleUtil = {
  circularView: circularView,
  centerView: centerView,
  horizontal: horizontalView,
  screenSubTitle: screenSubTitle,
  actionBarMiddleTitle: actionBarMiddleTitle,
  modalOptionsButton: modalOptionsButton,
  modalOptionsButtonText: modalOptionsButtonText,
  shadow: shadow,
  redDot: redDot,
};

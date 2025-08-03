import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import IconBack from "../../assets/userSettings/iconBack.svg";
import { useNavigation } from "@react-navigation/native";

interface Props {
  title?: string;
  rightContent?: React.ReactNode;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}
const AppBar = ({ title, rightContent, onBack, style }: Props) => {
  const navigation = useNavigation<any>();
  return (
    <View
      style={{
        ...styles.appBar,
        height: Platform.OS === "android" ? 48 : "auto",
        paddingVertical: Platform.OS === "android" ? 0 : 12,
        ...(style as ViewStyle),
        }}
    >
      <TouchableOpacity hitSlop={10}
        onPress={onBack || (() => navigation.goBack())}
        style={styles.backButton}
      >
        <IconBack />
      </TouchableOpacity>
      {title && <Text style={styles.title}>
        {title}
      </Text>}
      <View style={styles.rightContent}>{rightContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: "20%",
  },
  rightContent: {
    width: "20%",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
});

export default AppBar;

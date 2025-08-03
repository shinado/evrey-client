import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Theme } from "../constants/Theme";

interface ChipProps {
  icon?: string | React.ReactNode;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const Chip: React.FC<ChipProps> = ({ label, onPress, rightElement }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {rightElement}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(247,247,250,0.7)', // 极浅灰
    borderRadius: 999, // 超大圆角
    borderWidth: 1,
    borderColor: Theme.secondaryColors?.[100] || '#eee',
    minWidth: 0,
    marginRight: 8,
    marginBottom: 4,
    height: 24,
  },
  label: {
    fontSize: 12,
    color: Theme.text?.[200] || '#888',
    fontWeight: '400',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
});

export default Chip; 
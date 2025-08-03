import React from 'react';
import { View, Text,StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Theme } from "../constants/Theme";
import { FontFamily } from "../constants/typo";
import DeleteIcon from '../../assets/signIn/delete.svg';

type NumberKeyboardProps = {
  onNumberPress: (num: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const NumberKeyboard: React.FC<NumberKeyboardProps> = ({ onNumberPress, style, disabled = false }) => {
  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "⌫"],
  ];

  return (
    <View style={[styles.numberPad, style]}>
      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.numberRow}>
          {row.map((num, colIndex) => (
            <Pressable
              key={colIndex}
              style={({ pressed }) => [
                styles.numberButton,
                pressed && { backgroundColor: Theme.background[300] },
                disabled && styles.buttonDisabled
              ]}
              onPress={() => !disabled && onNumberPress(num)}
              disabled={disabled}
            >
              {num === '⌫' ? (
                <DeleteIcon width={25} height={20} />
              ) : (
                <Text style={[styles.numberText, disabled && styles.buttonTextDisabled]}>{num}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  numberPad: {
    width: "100%",
    paddingVertical: 12,
  },
  numberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  numberButton: {
    width: "30%",
    aspectRatio: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.background[100],
    borderRadius: 12,
  },
  numberText: {
    fontSize: 26,
    color: Theme.text[200],
    fontFamily: FontFamily.semiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextDisabled: {
    color: Theme.text[100],
  },
});

export default NumberKeyboard; 
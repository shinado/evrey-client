import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";

interface TokenIconProps {
  icon?: string;
  size?: number;
  style?: any;
}

const TokenIcon: React.FC<TokenIconProps> = ({ 
  icon, 
  size = 40,
  style 
}) => {
  const [imageError, setImageError] = useState(false);

  const isValidIcon = icon && 
    !imageError && 
    icon.startsWith('http');

  if (!isValidIcon) {
    return (
      <View style={[{ 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        backgroundColor: Theme.secondaryColors[100],
        alignItems: 'center',
        justifyContent: 'center' 
      }, style]}>
        <Ionicons 
          name="logo-usd" 
          size={size * 0.6} 
          color={Theme.secondaryColors[400]} 
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: icon }}
      style={[{
        width: size,
        height: size,
        borderRadius: size / 2
      }, style]}
      placeholder={null}
      onError={() => setImageError(true)}
    />
  );
};

export default TokenIcon; 
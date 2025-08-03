import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  TouchableOpacityProps, 
  ActivityIndicator 
} from 'react-native';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import i18n from '../i18n';

export type ButtonType = 'primary' | 'secondary' | 'outline' | 'follow';

interface ButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  type?: ButtonType;
  style?: any;
  loading?: boolean;
  disabled?: boolean;
  textStyle?: any;
  isFollowing?: boolean;
  loadingColor?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  style,
  textStyle,
  type = 'primary',
  loading = false,
  disabled = false,
  isFollowing,
  loadingColor = 'white',
  ...props 
}) => {
  // 根据类型和状态确定样式
  const buttonStyle = [
    styles.button,
    type === 'primary' && styles.primaryButton,
    type === 'secondary' && styles.secondaryButton,
    type === 'outline' && styles.outlineButton,
    type === 'follow' && (isFollowing ? styles.outlineButton : styles.primaryButton),
    type === 'follow' && styles.followButton,
    disabled && styles.buttonDisabled,
    style
  ];

  const computedTextStyle = [
    styles.text,
    type === 'primary' && styles.primaryText,
    type === 'secondary' && styles.secondaryText,
    type === 'outline' && styles.outlineText,
    type === 'follow' && (isFollowing ? styles.outlineText : styles.primaryText),
    type === 'follow' && styles.followButtonText,
    textStyle,
  ];

  // 如果是 follow 类型，使用特定的文本
  const buttonContent = type === 'follow' ? (
    isFollowing ? i18n.t('common.following') : i18n.t('common.follow')
  ) : children;

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      disabled={loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={loadingColor} 
          size="small" 
        />
      ) : (
        typeof buttonContent === 'string' ? (
          <Text style={computedTextStyle}>{buttonContent}</Text>
        ) : (
          buttonContent
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: Theme.primary,
  },
  secondaryButton: {
    backgroundColor: Theme.background[300],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.text[300],
  },
  followButton: {
    height: 32,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  buttonDisabled: {
    backgroundColor: Theme.background[400],
    borderColor: Theme.background[400],
  },
  text: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: Theme.text[50],
  },
  outlineText: {
    color: Theme.text[300],
  },
  followButtonText: {
    fontSize: 12,
  },
}); 
import React from 'react';
import BottomSheet from './BottomSheet';
import { Text, StyleSheet, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import { Button } from './Button';
import i18n from '../i18n';

export interface ErrorMessage {
  title: string;
  message: string;
  confirmText?: string;
}

interface ErrorComponentProps {
  errorMessage: ErrorMessage | null;
  onClose: () => void;
  onConfirm?: () => void;
  visible: boolean;
}

const ErrorBottomSheet: React.FC<ErrorComponentProps> = ({ errorMessage, onClose, onConfirm, visible }) => {
  if (!visible || !errorMessage) return null;

  return (
    <BottomSheet
      isVisible={visible}
      onClose={onClose}
      height="auto"
    >
      <View style={styles.container}>
        <Text style={styles.modalTitle}>{errorMessage.title}</Text>
        <Text style={styles.modalMessage}>{errorMessage.message}</Text>
        <Button
          type="primary"
          onPress={onConfirm ?? onClose}
          style={styles.button}
        >
          {errorMessage.confirmText || i18n.t('common.ok')}
        </Button>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: Theme.text[200],
    marginBottom: 24,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  }
});

export default ErrorBottomSheet;

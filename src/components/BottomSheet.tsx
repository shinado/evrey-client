import React, { ReactNode } from 'react';
import { View, StyleSheet, DimensionValue, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: DimensionValue;
  disableGestures?: boolean;
  contentStyle?: ViewStyle; // 添加新的 props
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  height = '85%',
  disableGestures = false,
  contentStyle = {}, // 默认空对象，防止 undefined
}) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={disableGestures ? [] : ['down']}
      style={styles.modal}
      backdropOpacity={0.3}
      propagateSwipe
      statusBarTranslucent
    >
      <View style={[styles.content, { height }, contentStyle]}>
        <View style={styles.dragIndicator} />
        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    margin: 8,
  },
});

export default BottomSheet;
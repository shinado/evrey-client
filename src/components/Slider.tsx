import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Theme } from '../constants/Theme';
import Ionicons from '@expo/vector-icons/Ionicons';

// Props 类型定义
interface SliderProps {
  height?: number;
  title: string;
  onSwipeComplete?: () => void;
  disabled?: boolean;
  style?: any;
  onTouchStart?: () => void;
  success?: boolean;  // 添加 success 属性
}

// Ref 方法定义
export interface SliderRef {
  reset: () => void;
}

const Slider = forwardRef<SliderRef, SliderProps>((props, ref) => {
  const {
    title,
    height,
    onSwipeComplete,
    disabled = false,
    onTouchStart,
    success = false,  // 默认为 false
  } = props;

  // 状态
  const [sliderPosition] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const isCompleted = useRef(false);
  const [maxSlideDistance, setMaxSlideDistance] = useState(0);  // 直接存储最大滑动距离

  // 尺寸常量
  const BUTTON_WIDTH = 80;

  // 获取容器宽度时直接计算最大滑动距离
  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setMaxSlideDistance(width - BUTTON_WIDTH);
  };

  // 重置方法
  const reset = () => {
    setLoading(false);
    isCompleted.current = false;
    sliderPosition.setValue(0);
  };

  // 暴露重置方法
  useImperativeHandle(ref, () => ({
    reset
  }));

  // 动画辅助函数
  const animateToPosition = (toValue: number, callback?: () => void) => {
    Animated.timing(sliderPosition, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start(callback);
  };

  // 手势处理
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => {
      if (!isCompleted.current && gestureState.numberActiveTouches === 1) {
        onTouchStart?.();
        return true;
      }
      return false;
    },

    onMoveShouldSetPanResponder: (_, gestureState) => {
      return !isCompleted.current && !disabled && gestureState.dx !== 0;
    },

    onPanResponderGrant: () => { },
    onPanResponderMove: (_, gestureState) => {
      if (!isCompleted.current && !disabled) {
        const newPosition = Math.max(0, Math.min(gestureState.dx, maxSlideDistance));
        sliderPosition.setValue(newPosition);
      }
    },

    onPanResponderRelease: (_, gestureState) => {
      if (!disabled) {
        if (gestureState.dx >= maxSlideDistance * 0.8) {
          setLoading(true);
          isCompleted.current = true;
          animateToPosition(maxSlideDistance, onSwipeComplete);
        } else {
          animateToPosition(0);
        }
      }
    },
  });

  // 渲染滑块按钮
  const renderSliderButton = () => (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.sliderButton,
        { transform: [{ translateX: sliderPosition }], height: height },
      ]}
    >
      <Text style={[
        styles.icon,
        loading && styles.iconHidden  // 使用透明度而不是移除组件
      ]}>⨠</Text>
    </Animated.View>
  );

  // 渲染滑动背景
  const renderBackground = () => {
    return (
      <Animated.View
        style={[
          styles.swipedBackground,
          {
            height: height,
            width: sliderPosition.interpolate({
              inputRange: [0, maxSlideDistance],
              outputRange: [BUTTON_WIDTH, maxSlideDistance + BUTTON_WIDTH],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        {loading && (success ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ))}
      </Animated.View>
    )
  };

  // 清理动画状态
  useEffect(() => {
    return () => {
      sliderPosition.setValue(0); // 重置滑块位置
      setLoading(false); // 重置加载状态
      isCompleted.current = false; // 重置完成状态
    };
  }, []);

  return (
    <View 
      style={[styles.slider, disabled && styles.disabled, {height}]}
      onLayout={onLayout}
    >
      <Text style={styles.instruction}>{title}</Text>
      {renderBackground()}
      {renderSliderButton()}
    </View>
  );
});

const styles = StyleSheet.create({
  slider: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',  // 添加这个以裁剪超出的部分
  },
  disabled: {
    opacity: 0.5,
  },
  swipedBackground: {
    position: 'absolute',
    borderRadius: 28,     // 只设置左边的圆角
    left: 0,
    backgroundColor: Theme.text[300],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  instruction: {
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    color: '#b0b0b0',
    position: 'absolute',
    zIndex: 1,
    ...Platform.select({
      web: {
        userSelect: 'none',  // 防止文字被选中
      }
    }),
  },
  sliderButton: {
    width: 80,//BUTTON_WIDTH,
    backgroundColor: Theme.text[300],
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 2,
    ...Platform.select({
      web: {
        cursor: 'grab',  // 或者 'pointer' 显示小手
      }
    }),
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    ...Platform.select({
      web: {
        userSelect: 'none',  // 防止文字被选中
      }
    }),
  },
  iconHidden: {
    opacity: 0,  // 只改变透明度
  },
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Slider;
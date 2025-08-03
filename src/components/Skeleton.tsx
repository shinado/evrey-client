import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// 定义传入的参数类型
interface SkeletonProps {
  isLoading: boolean; // 是否显示骨架屏
  layout: {
    width: number | string;
    height: number;
    marginBottom?: number;
    borderRadius?: number;
    marginRight?: number;
    marginTop?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomRightRadius?: number;
    borderBottomLeftRadius?: number;
  }; // 每个骨架屏的布局
  boneColor?: string; // 骨架屏的背景色
  highlightColor?: string; // 骨架屏的高亮色
}

const Skeleton: React.FC<SkeletonProps> = ({
  isLoading = true,
  layout,
  boneColor = "#E1E9EE",
  highlightColor = "#F2F8FC",
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      shimmerLoop.start();
      return () => {
        shimmerLoop.stop(); // 清理动画
        shimmerAnim.setValue(0); // 重置动画值
      };
    }
  }, [isLoading]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100], // 控制光晕的移动范围
  });

  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.skeletonContainer,
          {
            width: layout.width,
            height: layout.height,
            borderRadius: layout.borderRadius || 4,
            marginBottom: layout.marginBottom || 0,
            marginTop: layout.marginTop || 0,
            backgroundColor: boneColor,
            marginRight: layout.marginRight || 0,
            borderTopLeftRadius: layout.borderTopLeftRadius || 0,
            borderTopRightRadius: layout.borderTopRightRadius || 0,
            borderBottomRightRadius: layout.borderBottomRightRadius || 0,
            borderBottomLeftRadius: layout.borderBottomLeftRadius || 0,
          } as ViewStyle, // 类型断言
        ]}
      >
        <Animated.View
          style={[
            styles.skeletonGradient,
            { transform: [{ translateX: shimmerTranslateX }] },
          ]}
        >
          <LinearGradient
            colors={[boneColor, highlightColor, boneColor]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: layout.borderRadius || 4,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  skeletonContainer: {
    overflow: "hidden",
  },
  skeletonGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "100%",
  },
});

export default Skeleton;

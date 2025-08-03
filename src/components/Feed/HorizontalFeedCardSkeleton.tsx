import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "../Skeleton";

interface HorizontalFeedCardSkeletonProps {
  width?: number;
  height?: number;
}

const HorizontalFeedCardSkeleton: React.FC<HorizontalFeedCardSkeletonProps> = ({
  width = 350,
  height = 120,
}) => {
  return (
    <View style={[styles.container, { width, height }]}>
      {/* 左侧图片骨架 */}
      <Skeleton isLoading={true} layout={styles.image} />

      {/* 右侧内容骨架 */}
      <View style={styles.contentContainer}>
        {/* 标题骨架 */}
        <Skeleton isLoading={true} layout={styles.title} />

        {/* 代币信息行骨架 */}
        <View style={styles.tokenRow}>
          <Skeleton isLoading={true} layout={styles.token} />
        </View>

        {/* 价格骨架 */}
        <Skeleton isLoading={true} layout={styles.price} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#000",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: "white",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  image: {
    width: 72,
    height: 90,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: "space-between",
  },
  title: {
    width: "90%",
    height: 20, // 两行标题的高度
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  token: {
    width: 80,
    height: 34,
  },
  price: {
    width: 80,
    height: 16,
  },
});

export default HorizontalFeedCardSkeleton;

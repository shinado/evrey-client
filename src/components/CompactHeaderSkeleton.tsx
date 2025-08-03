import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

const CompactHeaderSkeleton: React.FC = () => {
  return (
    <View style={styles.compactHeader}>
      <View style={styles.compactLeft}>
        {/* 紧凑头像 */}
        <Skeleton
          isLoading={true}
          layout={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
          }}
        />
        {/* 紧凑用户名 */}
        <Skeleton
          isLoading={true}
          layout={{
            width: 80,
            height: 16,
            borderRadius: 4,
          }}
        />
      </View>
      {/* 关注按钮 */}
      <Skeleton
        isLoading={true}
        layout={{
          width: 80,
          height: 28,
          borderRadius: 6,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  compactHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  compactLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default CompactHeaderSkeleton;

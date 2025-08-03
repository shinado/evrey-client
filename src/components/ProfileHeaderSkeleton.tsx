import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "./Skeleton";

const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.infoBlock}>
        <View style={styles.infoContainer}>
          {/* 昵称 */}
          <Skeleton
            isLoading={true}
            layout={{
              width: 120,
              height: 20,
              marginBottom: 4,
              borderRadius: 4,
            }}
          />
          {/* 用户名 */}
          <Skeleton
            isLoading={true}
            layout={{
              width: 80,
              height: 16,
              marginBottom: 2,
              borderRadius: 4,
            }}
          />
        </View>
        {/* 头像 */}
        <Skeleton
          isLoading={true}
          layout={{
            width: 52,
            height: 52,
            borderRadius: 26,
          }}
        />
      </View>

      {/* 个人简介 */}
      <Skeleton
        isLoading={true}
        layout={{
          width: "90%",
          height: 14,
          marginBottom: 2,
          borderRadius: 4,
        }}
      />

      {/* 关注者数量 */}
      <Skeleton
        isLoading={true}
        layout={{
          width: 100,
          height: 13,
          marginBottom: 8,
          borderRadius: 4,
        }}
      />

      {/* 操作按钮行 */}
      <View style={styles.actionRow}>
        {/* 关注按钮 */}
        <Skeleton
          isLoading={true}
          layout={{
            width: 240,
            height: 24,
            borderRadius: 8,
            marginRight: 12,
          }}
        />
        {/* 分享按钮 */}
        <Skeleton
          isLoading={true}
          layout={{
            width: 40,
            height: 24,
            borderRadius: 8,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default ProfileHeaderSkeleton;

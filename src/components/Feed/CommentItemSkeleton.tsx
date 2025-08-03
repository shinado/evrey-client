import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "../Skeleton";

const CommentItemSkeleton: React.FC = () => {
  return (
    <View style={styles.commentItem}>
      {/* 头像骨架 */}
      <Skeleton
        isLoading
        layout={{
          width: 28,
          height: 28,
          borderRadius: 14,
          marginRight: 8,
        }}
      />

      <View style={styles.commentContent}>
        {/* 用户名骨架 */}
        <View style={styles.commentHeader}>
          <Skeleton
            isLoading
            layout={{
              width: 60,
              height: 13,
              marginBottom: 4,
            }}
          />
        </View>

        {/* 评论内容骨架 - 多行文本 */}
        <View style={styles.contentLines}>
          <Skeleton
            isLoading
            layout={{
              width: "90%",
              height: 12,
              marginBottom: 4,
            }}
          />
          <Skeleton
            isLoading
            layout={{
              width: "65%",
              height: 12,
              marginBottom: 8,
            }}
          />
        </View>

        {/* 元数据行骨架（时间、点赞、回复按钮） */}
        <View style={styles.metaRow}>
          <Skeleton
            isLoading
            layout={{
              width: 40,
              height: 10,
              marginRight: 12,
            }}
          />
          <Skeleton
            isLoading
            layout={{
              width: 20,
              height: 10,
              marginRight: 12,
            }}
          />
          <Skeleton
            isLoading
            layout={{
              width: 24,
              height: 10,
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    borderRadius: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentLines: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});

export default CommentItemSkeleton; 
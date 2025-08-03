import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import { Comment, Reply } from "../../types";
import { DefaultAvatar } from "../../constants/icons";
import { formatDate } from "../../utils";
import i18n, { useLanguage } from "../../contexts/LanguageContext";
import HeartIcon from "../../../assets/common/heart.svg";
import ReplyItem from "./ReplyItem";
import { useReplyList } from "../../hooks/useCommentList";
import { RouterName } from "../../constants/navigation";

interface CommentItemProps {
  comment: Comment;
  isAuthorId: string;
  likedComments: Set<string>;
  likeCounts: Map<string, number>;
  expandedComments: Set<string>;
  onLike: (commentId: string) => Promise<void>;
  onReply: (commentId: string, userId: string, nickname: string) => void;
  onLoadMoreReplies: (commentId: string) => void;
  onUpdateReplyStates?: (replies: Reply[]) => void;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isAuthorId,
  likedComments,
  likeCounts,
  expandedComments,
  onLike,
  onReply,
  onLoadMoreReplies,
  onUpdateReplyStates,
  postId,
}) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(
    expandedComments.has(comment.id)
  );

  // 使用 useReplyList hook 获取回复数据
  const {
    data: replyData,
    isLoading: repliesLoading,
    fetchNextPage: fetchNextReplies,
    hasNextPage: hasMoreReplies,
    isFetchingNextPage: isFetchingMoreReplies,
  } = useReplyList(postId, comment.id, "10");

  // 合并原始回复和动态加载的回复
  const originalReplies = comment.replies?.list || [];
  const dynamicReplies = replyData?.pages.flatMap((page) => page.items) || [];

  // 合并所有回复：原始回复 + 动态加载的回复
  const allReplies = isExpanded ? dynamicReplies : originalReplies;
  const hasReplies = allReplies.length > 0 || comment.reply_count > 0;

  // 当获取到动态回复数据时，通知父组件更新状态
  React.useEffect(() => {
    if (isExpanded && dynamicReplies.length > 0 && onUpdateReplyStates) {
      onUpdateReplyStates(dynamicReplies);
    }
  }, [isExpanded, dynamicReplies, onUpdateReplyStates]);

  // 检查是否还有更多回复可以加载
  const remainingReplies = comment.reply_count - allReplies.length;

  // 检查评论是否被点赞
  const isLiked = likedComments.has(comment.id);
  const currentLikeCount =
    likeCounts.get(comment.id) || comment.like_count || 0;

  // 检查是否是作者评论
  const isAuthorComment = comment.user_id === isAuthorId;

  // 处理展开/收起回复
  const handleToggleReplies = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      onLoadMoreReplies(comment.id);
    }
  };

  // 处理加载更多回复
  const handleLoadMoreReplies = () => {
    fetchNextReplies();
  };

  const navigation = useNavigation<any>();

  return (
    <View style={styles.commentItem}>
      <Image
        source={
          comment.user.avatar ? { uri: comment.user.avatar } : DefaultAvatar
        }
        style={styles.commentAvatar}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(RouterName.CREATOR_PROFILE, {
                creatorId: comment.user_id,
              })
            }
          >
            <Text style={styles.commentName}>{comment.user.nickname}</Text>
          </TouchableOpacity>
          {isAuthorComment && (
            <View style={styles.authorBadge}>
              <Text style={styles.authorBadgeText}>
                {i18n.t("feed.comments.author")}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        <View style={styles.commentMetaRow}>
          <Text style={styles.commentTime}>
            {formatDate(comment.created_at, language)}
          </Text>
          <View style={styles.commentLikeRow}>
            <TouchableOpacity onPress={() => onLike(comment.id)} hitSlop={10}>
              <HeartIcon
                width={10}
                height={10}
                fill={isLiked ? "red" : "none"}
              />
            </TouchableOpacity>
            <Text style={styles.commentLikeText}>{currentLikeCount}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              onReply(comment.id, comment.user_id, `User ${comment.user_id}`)
            }
          >
            <Text style={styles.replyButtonText}>
              {i18n.t("feed.comments.reply")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 回复列表 */}
        {hasReplies && (
          <View style={styles.repliesContainer}>
            {allReplies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                isAuthorId={isAuthorId}
                likedComments={likedComments}
                likeCounts={likeCounts}
                onLike={onLike}
                onReply={onReply}
              />
            ))}

            {/* 展开/收起回复按钮 */}
            {!isExpanded && comment.hasMoreReplies && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={handleToggleReplies}
                disabled={repliesLoading}
              >
                <Text style={styles.expandButtonText}>
                  {repliesLoading
                    ? "加载中..."
                    : `展开回复 (${remainingReplies})`}
                </Text>
              </TouchableOpacity>
            )}

            {/* 加载更多回复按钮（已展开状态） */}
            {isExpanded && hasMoreReplies && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={handleLoadMoreReplies}
                disabled={isFetchingMoreReplies}
              >
                <Text style={styles.expandButtonText}>
                  {isFetchingMoreReplies ? "加载中..." : "加载更多回复"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Theme.text[300],
  },
  authorBadge: {
    backgroundColor: "#E1F7F0",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  authorBadgeText: {
    fontSize: 10,
    color: Theme.primary,
    fontFamily: FontFamily.medium,
  },
  commentContent: {
    fontSize: 12,
    color: Theme.text[300],
    fontFamily: FontFamily.regular,
    marginTop: 2,
    flexWrap: "wrap",
  },
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  commentTime: {
    fontSize: 11,
    color: Theme.text[200],
    marginRight: 8,
  },
  commentLikeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentLikeText: {
    fontSize: 11,
    color: Theme.text[200],
    marginLeft: 2,
  },
  replyButtonText: {
    fontSize: 11,
    color: Theme.text[200],
    fontFamily: FontFamily.regular,
    marginLeft: 8,
  },
  repliesContainer: {
    marginTop: 8,
  },
  expandButton: {
    marginTop: 8,
    marginLeft: 16,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 11,
    color: Theme.primary,
    fontFamily: FontFamily.medium,
  },
});

export default CommentItem;

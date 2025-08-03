import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import { Reply } from "../../types";
import { DefaultAvatar } from "../../constants/icons";
import { formatDate } from "../../utils";
import i18n, { useLanguage } from "../../contexts/LanguageContext";
import HeartIcon from "../../../assets/common/heart.svg";
import { RouterName } from "../../constants/navigation";

interface ReplyItemProps {
  reply: Reply;
  isAuthorId: string;
  likedComments: Set<string>;
  likeCounts: Map<string, number>;
  onLike: (commentId: string) => Promise<void>;
  onReply: (commentId: string, userId: string, nickname: string) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  isAuthorId,
  likedComments,
  likeCounts,
  onLike,
  onReply,
}) => {
  const { language } = useLanguage();
  const navigation = useNavigation<any>();

  const isReplyLiked = likedComments.has(reply.id);
  const replyLikeCount = likeCounts.get(reply.id) || reply.like_count || 0;
  const isReplyAuthor = reply.user_id === isAuthorId;

  const handleUserPress = () => {
    navigation.navigate(RouterName.CREATOR_PROFILE, {
      creatorId: reply.user_id,
    });
  };

  const handleRepliedUserPress = () => {
    navigation.navigate(RouterName.CREATOR_PROFILE, {
      creatorId: reply.replied_user_id,
    });
  };

  return (
    <View style={styles.replyItem}>
      <Image
        source={reply.user.avatar || DefaultAvatar}
        style={styles.replyAvatar}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.replyHeader}>
          <TouchableOpacity onPress={handleUserPress}>
            <Text style={styles.replyName}>User {reply.user_id}</Text>
          </TouchableOpacity>
          {isReplyAuthor && (
            <View style={styles.authorBadge}>
              <Text style={styles.authorBadgeText}>
                {i18n.t("feed.comments.author")}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.replyContentContainer}>
          {reply.parent_id !== reply.root_id && (
            <View style={styles.replyPrefix}>
              <Text style={styles.replyText}>
                {i18n.t("feed.comments.reply")}{" "}
              </Text>
              <TouchableOpacity onPress={handleRepliedUserPress}>
                <Text style={[styles.replyText, { color: Theme.primary }]}>
                  @User {reply.replied_user_id}
                </Text>
              </TouchableOpacity>
              <Text style={styles.replyText}>：</Text>
            </View>
          )}
          <Text style={styles.replyText}>{reply.content}</Text>
        </View>
        <View style={styles.replyMetaRow}>
          <Text style={styles.replyTime}>
            {formatDate(reply.created_at, language)}
          </Text>
          <View style={styles.replyLikeRow}>
            <TouchableOpacity onPress={() => onLike(reply.id)} hitSlop={10}>
              <HeartIcon
                width={10}
                height={10}
                fill={isReplyLiked ? "red" : "none"}
              />
            </TouchableOpacity>
            <Text style={styles.replyLikeText}>{replyLikeCount}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              onReply(reply.id, reply.user_id, `User ${reply.user_id}`)
            }
          >
            <Text style={styles.replyLikeText}>
              {i18n.t("feed.comments.reply")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyName: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Theme.text[300],
  },
  authorBadge: {
    backgroundColor: "#E1F7F0",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorBadgeText: {
    fontSize: 10,
    color: Theme.primary,
    fontFamily: FontFamily.medium,
  },
  replyContentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  replyText: {
    fontSize: 11,
    color: Theme.text[300],
    fontFamily: FontFamily.regular,
  },
  replyPrefix: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyTime: {
    fontSize: 10,
    color: Theme.text[200],
  },
  replyLikeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  replyLikeText: {
    fontSize: 10,
    color: Theme.text[200],
    fontFamily: FontFamily.regular,
  },
});

export default ReplyItem;

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Theme } from "../constants/Theme";
import { FontFamily } from "../constants/typo";
import { DefaultAvatar } from "../constants/icons";
import { CoinFormatUtil } from "../utils";
import i18n from "../i18n";

export interface TradeData {
  id: string;
  postId: string;
  authorId: string;
  tradeId: string;
  tradeUserId: string;
  tradeAt: string;
  tradeType: number;
  tradeAmount: string;
  commissionAmount: string;
  tradeHash: string;
  tradeUser: TradeUser;
  tradeInputAmount: string;
  tradeOutputAmount: string;
}

export interface TradeUser {
  id: string;
  username: string;
  wallet: string;
  nickname: string;
  avatar: string;
  registerAt: string;
}

interface TradeItemProps {
  trade: TradeData;
  onPress?: (trade: TradeData) => void;
}

const TradeItem: React.FC<TradeItemProps> = ({ trade, onPress }) => {
  const handlePress = () => {
    onPress?.(trade);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return i18n.t("feedDetail.trade.justNow");
    if (diffInMinutes < 60)
      return i18n.t("feedDetail.trade.minutesAgo", { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return i18n.t("feedDetail.trade.hoursAgo", { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return i18n.t("feedDetail.trade.daysAgo", { count: diffInDays });

    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Image
          source={
            trade.tradeUser.avatar
              ? { uri: trade.tradeUser.avatar }
              : DefaultAvatar
          }
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {trade.tradeUser.nickname || trade.tradeUser.username}
          </Text>

          <Text style={styles.timestamp}>{formatTime(trade.tradeAt)}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            trade.tradeType === 1 ? styles.buyAmount : styles.sellAmount,
          ]}
        >
          {trade.tradeType === 1 ? "+" : "-"}${Number(trade.tradeType === 1 ? trade.tradeInputAmount : trade.tradeOutputAmount) / 1e6}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[200],
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  buyAmount: {
    color: Theme.ascend,
  },
  sellAmount: {
    color: Theme.descend,
  },
});

export default TradeItem;

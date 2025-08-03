import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Theme } from "../../constants/Theme";
import { Image } from "expo-image";
import { CoinFormatUtil } from "../../utils/format";
import TokenIcon from "../TokenIcon";
import { FontFamily } from "../../constants/typo";
import { Post } from "../../types/content";

interface HorizontalFeedCardProps {
  item: Post;
  onPress: (item: Post) => void;
  width?: number;
  height?: number;
}

const HorizontalFeedCard: React.FC<HorizontalFeedCardProps> = ({
  item,
  onPress,
  width = 350,
  height = 120,
}) => {
  // 使用 head_img 作为封面图片
  const coverImage = item.head_img || "https://via.placeholder.com/300";

  return (
    <TouchableOpacity
      style={[styles.container, { width, height }]}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: coverImage }}
        style={[styles.image, { height: height - 30 }]}
        contentFit="cover"
      />

      <View style={styles.contentContainer}>
        <Text numberOfLines={2} ellipsizeMode="tail" style={styles.title}>
          {item.title}
        </Text>

        <View style={styles.tokenRow}>
          <View style={styles.tokenInfo}>
            <TokenIcon icon={item.coin?.icon} size={16} />
            <Text style={styles.tokenSymbol} numberOfLines={1}>
              {item.coin?.symbol}
            </Text>
          </View>
        </View>

        <Text style={styles.price}>
          ${CoinFormatUtil.formatPrice(Number(item.commissionAmount) / 1e6)}
        </Text>
      </View>
    </TouchableOpacity>
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
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    position: "relative",
  },
  title: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Theme.textColors[300],
    lineHeight: 16,
    flexWrap: "wrap",
    textAlign: "left",
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  tokenSymbol: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Theme.textColors[300],
  },
  price: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Theme.textColors[300],
    textAlign: "right",
    position: "absolute",
    top: 28,
    right: 0,
  },
});

export default HorizontalFeedCard;

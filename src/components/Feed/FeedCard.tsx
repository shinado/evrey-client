import React from 'react';
import { useUserInfo } from 'src/hooks/useUserInfo';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/Theme';
import { Image } from 'expo-image';
import { CoinFormatUtil } from '../../utils/format';
import TokenIcon from '../TokenIcon';
import { FontFamily } from '../../constants/typo';
import { Post } from '../../types/content';
import HeartIcon from '../../../assets/common/heart.svg';
import { DefaultAvatar } from '../../constants/icons';

interface FeedCardProps {
  item: Post;
  onPress: (item: Post) => void;
  width: number;
}

const FeedCard: React.FC<FeedCardProps> = ({ item, onPress, width }) => {
  const { userInfo } = useUserInfo();
  const coverImage = item.head_img || 'https://via.placeholder.com/300';

  // 使用 coin 信息
  const tokenPriceChangePercent = Number(item.coin?.priceChangePercentage) || 0;
  const tokenColor =
    tokenPriceChangePercent > 0 ? Theme.primary : tokenPriceChangePercent < 0 ? Theme.secondary : Theme.textColors[200];

  return (
    <TouchableOpacity style={{ width, marginVertical: 8 }} onPress={() => onPress(item)} activeOpacity={0.9}>
      <View style={styles.authorContainer}>
        {/* 推荐数据冗余存储，更新有延迟，用户修改信息后，可能显示不及时，所以需要判断 */}
        <Image
          source={
            userInfo?.id === item?.author?.id
              ? { uri: userInfo?.avatar }
              : item?.author?.avatar
                ? { uri: item?.author?.avatar }
                : DefaultAvatar
          }
          style={styles.avatar}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName} numberOfLines={1}>
            {userInfo?.id === item?.author?.id
              ? userInfo?.nickname || userInfo?.username
              : item?.author?.nickname || item?.author?.username}
          </Text>
          <Text style={styles.authorUsername} numberOfLines={1}>
            <HeartIcon width={10} height={10} fill={item.isFavorited ? 'red' : 'none'} /> {item.favoritesCount || 0}
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Image source={{ uri: coverImage }} style={[styles.image, { height: width }]} contentFit="cover" />
        <View style={styles.descriptionContainer}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.title, styles.tokenInfo]}>
            {item.title}
          </Text>
          <View style={styles.tokenRow}>
            <View style={styles.tokenIconContainer}>
              <TokenIcon icon={item.coin?.icon} size={16} />
              <Text style={[styles.tokenInfo, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                {item.coin?.symbol}
              </Text>
            </View>
            <Text style={[styles.tokenInfo, { color: tokenColor }]}>
              {CoinFormatUtil.formatPercentageWithSign(tokenPriceChangePercent)}
            </Text>
          </View>
        </View>
      </View>
      {/* TODO: Delete this after testing */}
      {/* <View style={styles.scoreContainer}>
        <Text>Post ID: {item.id}</Text>
        <Text>Time Score: {item.timeScore}</Text>
        <Text>Coin Score: {item.coinScore}</Text>
        <Text>Interaction Score: {item.interactionScore}</Text>
        <Text>Manual Score: {item.manual_score}</Text>
        <Text>Total Score: {item.totalScore}</Text>
      </View> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginBottom: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 2,
  },
  authorName: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Theme.textColors[300],
  },
  authorUsername: {
    lineHeight: 14,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.textColors[300],
  },
  contentContainer: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 15,
    borderColor: '#000',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
    backgroundColor: 'white',
  },
  descriptionContainer: {
    paddingHorizontal: 8,
    gap: 5,
    marginTop: 4,
    marginBottom: 13,
  },
  title: {
    lineHeight: 18,
    height: 40,
  },
  image: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  tokenIconContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tokenInfo: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Theme.textColors[300],
  },
  scoreContainer: {
    paddingHorizontal: 8,
    gap: 5,
    marginTop: 4,
    marginBottom: 13,
  },
});

export { styles };
export default FeedCard;

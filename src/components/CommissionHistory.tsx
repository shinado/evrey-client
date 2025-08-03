import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import { DefaultAvatar } from '../constants/icons';
import { CoinFormatUtil } from '../utils/format';
import { CommissionHistoryItem } from '../types/history';

interface CommissionHistoryProps {
  trade: CommissionHistoryItem;
  onPress?: (trade: CommissionHistoryItem) => void;
  onViewTxPress?: (txHash: string) => void;
}

const CommissionHistory: React.FC<CommissionHistoryProps> = ({ trade, onPress, onViewTxPress }) => {
  const handlePress = () => {
    onPress?.(trade);
  };

  const handleViewTxPress = async () => {
    if (trade.tradeHash) {
      const baseUrl = 'https://solscan.io/tx/';
      const url = `${baseUrl}${trade.tradeHash}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Clipboard.setStringAsync(trade.tradeHash);
      }
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Image
            source={trade.tradeUser.avatar ? { uri: trade.tradeUser.avatar } : DefaultAvatar}
            style={styles.userAvatar}
          />
          <Text style={styles.userName} numberOfLines={1}>
            {trade.tradeUser.nickname || trade.tradeUser.username}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(trade.tradeAt)}</Text>
      </View>

      {/* Post信息卡片 */}
      <View style={styles.postCard}>
        <Image
          source={{
            uri: trade.post.head_img || 'https://example.com/post-icon.png',
          }}
          style={styles.postImage}
        />
        <View style={styles.postInfo}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {trade.post.title}
          </Text>
          <View style={styles.postSymbolContainer}>
            <View style={styles.postSymbolBadge}>
              <Text style={styles.postSymbol}>{trade.post.coin.attributes.symbol}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 交易详情行 */}
      <View style={styles.tradeDetails}>
        <View style={styles.amounts}>
          <Text style={styles.primaryAmount}>${CoinFormatUtil.formatPrice(trade.tradeAmount)}</Text>
          {trade.commissionAmount && (
            <Text style={styles.secondaryAmount}>${CoinFormatUtil.formatPrice(trade.commissionAmount)}</Text>
          )}
        </View>

        <View style={styles.statusSection}>
          <Text style={[styles.statusText, styles.statusSuccessful]}>Successful</Text>
          {trade.tradeHash && (
            <TouchableOpacity onPress={handleViewTxPress}>
              <Text style={styles.viewTxText}>View TX</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[200],
  },
  postCard: {
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    flexDirection: 'row',
  },
  postImage: {
    width: 48,
    height: 60,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  postTitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Theme.text[300],
    marginBottom: 4,
    lineHeight: 18,
  },
  postSymbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postSymbolBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  postSymbol: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#FF8A00',
  },
  tradeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amounts: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryAmount: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 2,
  },
  secondaryAmount: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Theme.text[300],
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 6,
    overflow: 'hidden',
  },
  statusSuccessful: {
    backgroundColor: 'rgba(58, 188, 106, 0.10)',
    color: '#3ABC6A',
  },
  viewTxText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Theme.primary,
    textDecorationLine: 'underline',
  },
});

export default CommissionHistory;

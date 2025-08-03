import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";
import TokenIcon from "./TokenIcon";
import { UiToken } from "../types/token";
import { getPriceChangeIconAndColor, CoinFormatUtil } from "../utils";
import { FontFamily } from "../constants/typo";
import { StyleProp, ViewStyle } from "react-native";



interface CoinListItemProps {
  style?: StyleProp<ViewStyle>;
  token: UiToken;
  onPress?: () => void;
  subValue?: string;
  earningsRate?: string;
  showMarketCap?: boolean;
  tokenBalance?: string;
  showDragHandle?: boolean;
  onLongPress?: () => void;
  isCashToken?: boolean;
}

const CoinListItem: React.FC<CoinListItemProps> = React.memo(({
  style,
  token,
  onPress,
  subValue,
  earningsRate,
  tokenBalance,
  onLongPress,
  showMarketCap = true,
  showDragHandle = false,
}) => {
  const {
    icon,
    symbol,
    marketCapUsd,
    volume24h,
    quoteTokenPriceUsd,
    priceChangePercentage,
  } = token;

  // 获取当前价格变化状态
  const { color: changeColor, icon: changeIcon } = getPriceChangeIconAndColor(Number(showMarketCap ? priceChangePercentage : earningsRate));
  
  // 判断是否显示盈利信息
  const shouldShowEarnings = !['SOL', 'USDT'].includes(symbol.toUpperCase());
  const shouldShowPriceChange = symbol.toUpperCase() !== 'USDT';

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={[styles.container,style]}>
        <TokenIcon icon={icon} size={40} />
        {/* 代币信息 */}
        <View style={styles.infoContainer}>
          <Text style={styles.symbolText}>{symbol}</Text>
          <Text style={styles.subText}>
          {showMarketCap ? (Number(marketCapUsd) > 0 && Number(volume24h) > 0 
            ? `${CoinFormatUtil.formatAmount(volume24h)} VOL · ${CoinFormatUtil.formatAmount(marketCapUsd)} MC`
            :  Number(marketCapUsd) > 0 
            ? `${CoinFormatUtil.formatAmount(marketCapUsd)} MC`
            : `${CoinFormatUtil.formatAmount(volume24h)} VOL`
          ): subValue}
          </Text>
        </View>

        {/* 价格信息 */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            ${showMarketCap
              ? CoinFormatUtil.formatPrice(quoteTokenPriceUsd)
              : CoinFormatUtil.formatPrice(tokenBalance)}
          </Text>
          {showMarketCap ? shouldShowPriceChange &&(
              <Text style={[styles.changeText, { color: changeColor }]}>
              {changeIcon && <Ionicons name={changeIcon} size={12} color={changeColor} />}{CoinFormatUtil.formatPercentage(priceChangePercentage)}
              </Text>
            ) : shouldShowEarnings && (
              <Text style={[styles.changeText, { color: changeColor }]}>
                  {changeIcon && <Ionicons name={changeIcon} size={12} color={changeColor} />}{CoinFormatUtil.formatPercentage(earningsRate)}
              </Text>
          )}
        </View>
        
        {showDragHandle && (
          <View style={styles.dragHandle}>
            <Ionicons name="menu" size={20} color="#999" />
          </View>
        )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  symbolText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Theme.textColors[300],
  },
  subText: {
    color: Theme.textColors[300],
    fontSize: 11,
    lineHeight: 12,
    fontFamily: FontFamily.medium,
  },
  priceContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  changeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  dragHandle: {
    marginLeft: 10,
    paddingLeft: 10,
  },
});

export { styles };
export default CoinListItem;

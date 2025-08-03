import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import TokenIcon from "./TokenIcon";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Theme } from "../constants/Theme";
import { Token } from "../types/token";
import { CoinFormatUtil } from "../utils";

// 常量定义
const CHART_COLORS = {
  POSITIVE: "#2DC26E",
  NEGATIVE: "#F55353", 
  NEUTRAL: "#888",
} as const;

const CHART_PATHS = {
  POSITIVE: {
    main: "M0,40 L30,30 L60,15 L90,25 L120,8 L150,20 L180,5 L200,15",
    fill: "M0,40 L30,30 L60,15 L90,25 L120,8 L150,20 L180,5 L200,15 L200,60 L0,60 Z",
  },
  NEGATIVE: {
    main: "M0,8 L30,20 L60,40 L90,25 L120,35 L150,30 L180,45 L200,30",
    fill: "M0,8 L30,20 L60,40 L90,25 L120,35 L150,30 L180,45 L200,30 L200,60 L0,60 Z",
  },
  NEUTRAL: {
    main: "M0,20 L30,25 L60,15 L90,20 L120,15 L150,25 L180,15 L200,20",
    fill: "M0,20 L30,25 L60,15 L90,20 L120,15 L150,25 L180,15 L200,20 L200,60 L0,60 Z",
  },
} as const;

interface TokenCardProps {
  token: Token;
  onPress: () => void;
}

const TokenCard = ({ token, onPress }: TokenCardProps) => {
  // 直接使用原始数值判断，避免格式化后的字符串转换问题
  const priceChangeValue = Math.round(Number(token.priceChangePercentage) * 100) / 100;
  const isPositive = priceChangeValue > 0;
  const isNeutral = priceChangeValue === 0;
  
  // 检查是否为USDT，如果是则禁用点击
  const isUSDT = token.attributes.name === "USDT";
  
  const getPathColor = () => {
    if (isPositive) return CHART_COLORS.POSITIVE; 
    if (isNeutral) return CHART_COLORS.NEUTRAL;
    return CHART_COLORS.NEGATIVE;
  };

  const getChartPaths = () => {
    if (isPositive) return CHART_PATHS.POSITIVE;
    if (isNeutral) return CHART_PATHS.NEUTRAL;
    return CHART_PATHS.NEGATIVE;
  };
  
  const { main: mainPath, fill: fillPath } = getChartPaths();
  const pathColor = getPathColor();
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={isUSDT}> 
      <TokenIcon icon={token.attributes.image} style={styles.icon} size={30}/>
      <View style={styles.numRow}>
        <Text style={styles.name}>{token.attributes.name}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>${CoinFormatUtil.formatPrice(token.account.balance_usd)}</Text>
          <Text style={[styles.change, { color: pathColor }] }>
            {CoinFormatUtil.formatPercentageWithSign(token.priceChangePercentage)}
          </Text>
        </View>
      </View>
      <Svg width="100%" height={32} viewBox="0 0 200 40">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={pathColor} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={pathColor} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        <Path
          d={fillPath}
          fill="url(#grad)"
          stroke="none"
        />
        <Path
          d={mainPath}
          fill="none"
          stroke={pathColor}
          strokeWidth={2}
        />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    gap: 2,
  },
  icon: {
    marginTop: 8,
    marginLeft: 8,
  },
  numRow: {
    paddingHorizontal: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.text[300],
  },
  amountRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 12,
    color: Theme.text[200],
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TokenCard; 
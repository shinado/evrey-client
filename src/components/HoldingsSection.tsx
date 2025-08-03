import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { CoinFormatUtil } from "../utils/format";
import i18n from "../i18n";
import SkeletonCoinListItem from "../components/SkeletonCoinListItem";
import CoinListItem from "../components/CoinListItem";
import { Theme } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { Token, UiToken } from "src/types/token";
import { FontFamily } from "../constants/typo";
import { useTokenHoldings, useTokensAggregate } from "../hooks/useBalance";
import { useNavigation } from "@react-navigation/native";
import { RouterName } from "../constants/navigation";

const convertTokenToUiToken = (token: Token): UiToken => {
    return {
      icon: token.attributes.image,
      marketCapUsd: token.marketCapUSD ?? "",
      mint: token.attributes.address,
      name: token.attributes.name,
      symbol: token.attributes.symbol,
      priceChangePercentage: token.priceChangePercentageH24 ?? "",
      quoteTokenPriceUsd: token.priceUSD ?? "",
      decimals: token.attributes.decimals,
    };
  };

const HoldingsSection: React.FC<{ userId?: string }> = ({ userId }) => {
  const navigation = useNavigation<any>();
  
  // 根据是否提供 userId 选择不同的 hook
  const tokenHoldingsQuery = useTokenHoldings(userId);
  const tokensAggregateQuery = useTokensAggregate();
  
  // 使用对应的数据源
  const tokenHoldings = userId ? tokenHoldingsQuery.tokenHoldings : tokensAggregateQuery.tokensAggregate;
  const loading = userId ? tokenHoldingsQuery.loading : tokensAggregateQuery.loading;
  const refetch = userId ? tokenHoldingsQuery.refetch : tokensAggregateQuery.refetch;
  
  const totalBalance = Number(tokenHoldings?.balance_usd || 0);
  const cashBalance = Number(tokenHoldings?.cash_balance_usd || 0);
  const tokenBalance = totalBalance - cashBalance;
  const tokens = tokenHoldings?.tokens || [];
  const cashToken = tokenHoldings?.cash_token;

  const handleTokenPress = (token: Token) => {
    navigation.navigate(RouterName.TOKEN_INFO, { token: convertTokenToUiToken(token) });
  };

  return (
    <>
      {/* Cash Section */}
      <LinearGradient
        colors={["#F7F8FA", "white"]}
        style={styles.cashSection}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            {i18n.t("holdings.balance.cash")}
          </Text>
          <Text style={[styles.sectionTitle, styles.sectionAmount]}>
            ${CoinFormatUtil.formatPrice(cashBalance)}
          </Text>
        </View>
        {loading ? (
          <SkeletonCoinListItem />
        ) : (
          cashToken && (
            <>
              <CoinListItem
                style={styles.cashTokenItem}
                token={convertTokenToUiToken(cashToken)}
                subValue={`${CoinFormatUtil.formatTokenQuantity(cashToken.account.balance_token.ui_amount)} ${cashToken.attributes.symbol}`}
                showMarketCap={false}
                tokenBalance={cashToken.account.balance_usd}
              />
              <View style={styles.footerNoteContainer}>
                <Ionicons name="information-circle-outline" size={12} color={Theme.text[100]} />
                <Text style={styles.footerNote}>
                  {i18n.t("holdings.cashNote")}
                </Text>
              </View>
            </>
          )
        )}
      </LinearGradient>

      {/* Evreys Section */}
      <LinearGradient
        colors={["#F7F8FA", "white"]}
        style={[styles.cashSection, { flex: 1 }]}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            {i18n.t("holdings.balance.tokens")}
          </Text>
          <Text style={[styles.sectionTitle, styles.sectionAmount]}>
            ${CoinFormatUtil.formatPrice(tokenBalance)}
          </Text>
        </View>
        {loading ? (
          <SkeletonCoinListItem />
        ) : tokens.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="wallet"
              size={40}
              color={Theme.background[400]}
              style={styles.walletIcon}
            />
            <Text style={styles.emptyTitle}>
              {i18n.t("holdings.noTokens")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={tokens}
            renderItem={({ item: token }) => (
              <CoinListItem
                token={convertTokenToUiToken(token)}
                subValue={`${CoinFormatUtil.formatTokenQuantity(token.account.balance_token.ui_amount)} ${token.attributes.symbol}`}
                showMarketCap={false}
                tokenBalance={token.account.balance_usd}
                earningsRate={token.profit_margin.rate}
                onPress={() => {
                  handleTokenPress(token);
                }}
              />
            )}
            keyExtractor={(token) => token.attributes.address}
            scrollEnabled={false}
          />
        )}
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
    cashSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
    },
    sectionTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: Theme.text[200],
    },
    sectionAmount: {
      fontFamily: FontFamily.medium,
    },
    emptyState: {
      alignItems: "center",
      marginTop: 32,
    },
    walletIcon: {
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: Theme.text[50],
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: Theme.secondaryColors[400],
      textAlign: "center",
    },
    cashTokenItem: {
      paddingBottom: 12,
    },
    footerNoteContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 6,
    },
    footerNote: {
      fontSize: 10,
      color: Theme.text[100],
    },
    changeText: {
      fontWeight: "600",
    },
  });

export default HoldingsSection;
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { FontFamily } from "../../constants/typo";
import AppBar from "../../components/AppBar";
import i18n from "../../i18n";
import { ActivityIndicator } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { useTokensAggregate } from "../../hooks/useBalance";
import { getPriceChangeIconAndColor, CoinFormatUtil } from "../../utils";
import { Ionicons } from "@expo/vector-icons";
import TokenIcon from "../../components/TokenIcon";

const HoldingsAnalysisScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { tokensAggregate, loading, refetch } = useTokensAggregate();

    // 过滤掉 SOL 代币
    const filteredTokens = tokensAggregate?.tokens?.filter(
      (token: any) => token.attributes.symbol.toUpperCase() !== 'SOL'
    );
  
  // 计算总盈亏
  const profitLoss = tokensAggregate?.profit_margin || {
    earnings: 0,
    cost: 0,
    rate: 0,
  };
  const { color: profitLossColor, icon: profitLossIcon } = getPriceChangeIconAndColor(
    Number(profitLoss?.rate ?? 0)
  );

  // 计算总资产价值
  const totalHoldingsUsd = tokensAggregate?.balance_usd;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = ({ item }: any) => {
    const { color, icon } = getPriceChangeIconAndColor(Number(item.profit_margin?.rate ?? 0));
    
    return (
      <View style={styles.item}>
        <View style={styles.item_header}>
          <TokenIcon
            icon={item.attributes.image}
            size={36}
            style={styles.item_header_icon} 
          />
          <View>
            <Text style={styles.item_header_name}>{item.attributes.name}</Text>
            <Text style={styles.item_header_amount}>
              {item.attributes.symbol}
            </Text>
          </View>
        </View>

        <View style={styles.item_card}>
          <Text style={styles.item_card_inventory}>{i18n.t("holdings.analysis.earnings")}</Text>
          <View style={styles.item_card_content}>
            <Text style={[styles.item_card_value, { color }]}>
              ${CoinFormatUtil.formatPrice(item.profit_margin?.earnings ?? 0)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
              {icon && <Ionicons name={icon} size={12} color={color} />}
              <Text style={[styles.item_card_value, { color }]}>
                {CoinFormatUtil.formatPercentage(item.profit_margin?.rate ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.item_card}>
          <Text style={styles.item_card_inventory}>{i18n.t("holdings.analysis.balanceUsd")}</Text>
          <View style={styles.item_card_content}>
            <Text style={styles.item_card_value}>
              ${CoinFormatUtil.formatPrice(item.account.balance_usd)}
            </Text>
          </View>
        </View>

        <View style={[styles.item_card, { marginBottom: 0 }]}>
          <Text style={styles.item_card_inventory}>{i18n.t("holdings.analysis.holdings")}</Text>
          <View style={styles.item_card_content}>
            <Text style={styles.item_card_value}>
              {Number(item.account.balance_token.ui_amount).toFixed(4)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title={i18n.t("holdings.analysis.title")} />
      <FlatList
        style={styles.list}
        data={filteredTokens}
        ListHeaderComponent={() => (
          <>
            <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color={Theme.text[100]} />
            <Text style={styles.warningText}>
              {i18n.t('holdings.analysis.warning')}
            </Text>
          </View>
            <View style={styles.container_header}>
              <Text style={styles.loss}>{i18n.t("holdings.analysis.overview")}</Text>
              <Text style={[styles.loss_value, { color: profitLossColor }]}>
                {CoinFormatUtil.formatPrice(profitLoss?.earnings ?? 0)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {profitLossIcon && (
                  <Ionicons name={profitLossIcon} size={12} color={profitLossColor} />
                )}
                <Text style={[styles.loss_percentage, { color: profitLossColor }]}>
                  {CoinFormatUtil.formatPercentage(profitLoss?.rate ?? 0)}
                </Text>
              </View>
            </View>
            <View style={styles.asset}>
              <Text style={styles.asset_lable}>{i18n.t("holdings.analysis.balanceUsd")}</Text>
              <Text style={styles.asset_value}>
                ${CoinFormatUtil.formatPrice(totalHoldingsUsd)}
              </Text>
            </View>
          </>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyExtractor={(item) => item.attributes.address}
        renderItem={renderItem}
        ListFooterComponent={() =>
          loading ? (
            <ActivityIndicator size="small" color="blue" style={styles.loader} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  header: {
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
    marginBottom: 16,
  },
  list: {
    flex: 1,
    backgroundColor: Theme.primaryWhiteColors["1"],
  },
  item: {
    padding: 16,
  },
  item_header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  item_header_icon: {
    width: 36,
    height: 36,
    borderRadius: 36,
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  item_header_name: {
    fontFamily: FontFamily.semiBold,
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  item_header_amount: {
    color: "#717277",
    fontSize: 12,
  },
  item_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  item_card_content: {
    flexDirection: "row",
  },
  item_card_inventory: {
    color: "#717277",
    fontSize: 14,
  },
  item_card_value: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: FontFamily.medium,
  },
  loader: {
    marginVertical: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background[100],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[100],
    lineHeight: 20,
  },
  container_header: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
  },
  loss: {
    fontSize: 14,
    fontWeight: "500",
    color: "#717277",
  },
  loss_value: {
    fontSize: 32,
    fontWeight: "600",
    color: "#3ABC6A",
    fontFamily: FontFamily.semiBold,
    lineHeight: 44,
  },
  loss_percentage: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: FontFamily.medium,
    color: "#3ABC6A",
  },
  asset: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20
  },
  asset_lable: {
    fontSize: 13,
    fontWeight: "500",
    color: "#717277",
  },
  asset_value: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    fontFamily: FontFamily.medium,
  }
});

export default {
  screen: HoldingsAnalysisScreen,
};

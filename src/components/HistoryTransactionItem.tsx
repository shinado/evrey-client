import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Theme } from "../constants/Theme";
import { FontFamily } from "../constants/typo";
import { SolanaIcon, USDTIcon } from "../constants/icons";
import { CoinFormatUtil } from "../utils/format";
import { SOL_ADDRESS } from "../constants/Crypto";
import i18n from "../i18n";

export interface TransactionData {
  id: string;
  type: number;
  mint?: string;
  coin_image_url?: string;
  coin_symbol: string;
  timestampDate?: string;
  createdAt: string;
  amountToken?: string;
  inputAmount?: string;
  status: number;
  signature?: string;
  txHash?: string;
  extraData?: {
    recipientId?: string;
    senderUserId?: string;
  };
}

interface HistoryTransactionItemProps {
  transaction: TransactionData;
  activeTab: "transaction" | "fund" | "views";
  activeSubTag: string;
  isLast?: boolean;
  onHashPress?: (hash: string) => void;
  getDataType: (type?: number) => { text: string; color: string };
  formatTransactionDate: (dateString: string) => string;
}

const HistoryTransactionItem: React.FC<HistoryTransactionItemProps> = ({
  transaction: tx,
  activeTab,
  activeSubTag,
  isLast = false,
  onHashPress,
  getDataType,
  formatTransactionDate,
}) => {
  const handleHashPress = () => {
    const hash = tx.signature || tx.txHash;
    if (hash && onHashPress) {
      onHashPress(hash);
    }
  };

  return (
    <View
      style={[
        styles.listItem,
        isLast && { borderBottomColor: "#FFF" },
      ]}
    >
      <View style={styles.itemTop}>
        <View style={styles.infoBox}>
          <Text
            style={[
              styles.itemType,
              getDataType(tx.type).color === "active" && styles.textActive,
            ]}
          >
            {getDataType(tx.type).text}
          </Text>
          {activeSubTag === "reward" ? (
            <USDTIcon
              width={18}
              height={18}
              style={styles.orderImage}
            />
          ) : tx.mint === SOL_ADDRESS ? (
            <SolanaIcon
              width={18}
              height={18}
              style={styles.orderImage}
            />
          ) : (
            <Image
              source={{
                uri: tx.coin_image_url || "https://example.com/token-icon.png",
              }}
              style={styles.orderImage}
            />
          )}
          <Text style={styles.coinName}>{tx.coin_symbol}</Text>
        </View>
        <Text style={styles.transactionTime}>
          {tx.timestampDate || formatTransactionDate(tx.createdAt)}
        </Text>
      </View>
      
      <View style={styles.itemBottom}>
        {tx.amountToken && (
          <Text style={styles.amountNumber}>
            {["reward", "buy"].includes(activeSubTag)
              ? `$ ${CoinFormatUtil.formatPrice(tx.amountToken)}`
              : CoinFormatUtil.formatQuantity(tx.amountToken)}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {tx.inputAmount && (
            <Text style={styles.amountNumber}>
              {["reward", "buy"].includes(activeSubTag)
                ? `$ ${CoinFormatUtil.formatPrice(tx.inputAmount)}`
                : CoinFormatUtil.formatQuantity(tx.inputAmount)}
            </Text>
          )}
        </View>
        
        <View style={styles.statusTextBox}>
          {activeTab === "fund" && activeSubTag === "deposit" && (
            <View style={styles.statusButtonBox}>
              <Text style={[styles.statusText, styles.statusSuccess]}>
                {i18n.t("history.status.success")}
              </Text>
            </View>
          )}
          {activeSubTag !== "airdrop" && activeSubTag !== "deposit" && (
            <View style={styles.statusButtonBox}>
              <Text
                style={[
                  styles.statusText,
                  styles.statusPadding,
                  tx.status === 1000 && styles.statusSuccess,
                  tx.status === -100 && styles.statusFail,
                ]}
              >
                {tx.status === 1000
                  ? i18n.t("history.status.success")
                  : tx.status === -100
                    ? i18n.t("history.status.failed")
                    : i18n.t("history.status.pending")}
              </Text>
            </View>
          )}
          {(activeTab === "transaction" ||
            (activeTab === "fund" &&
              ["transfer", "withdraw", "reward"].includes(activeSubTag))) &&
            tx.status === 1000 && (
              <TouchableOpacity onPress={handleHashPress}>
                <Text style={styles.statusLinkText}>
                  {i18n.t("history.status.getTX")}
                </Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
      
      {activeSubTag === "transfer" && (
        <Text style={[styles.idText, { marginTop: 8 }]}>
          UID {tx?.extraData?.recipientId || tx?.extraData?.senderUserId}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.background[100],
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemType: {
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    fontSize: 14,
    fontStyle: "normal",
  },
  orderImage: {
    width: 18,
    height: 18,
    borderRadius: 10,
    marginRight: 4,
    marginLeft: 8,
  },
  coinName: {
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
    fontSize: 14,
    fontStyle: "normal",
    lineHeight: 22,
  },
  transactionTime: {
    color: Theme.text[100],
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    fontSize: 12,
    fontStyle: "normal",
  },
  itemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusTextBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  amountNumber: {
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
    fontWeight: "600",
    fontSize: 14,
    fontStyle: "normal",
  },
  statusButtonBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    overflow: "hidden",
  },
  statusText: {
    color: Theme.text[100],
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    fontSize: 12,
    fontStyle: "normal",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  statusPadding: {
    backgroundColor: "rgba(113, 114, 119, 0.10)",
  },
  statusSuccess: {
    backgroundColor: "rgba(58, 188, 106, 0.10)",
    color: "#3ABC6A",
  },
  statusFail: {
    backgroundColor: "rgba(233, 69, 129, 0.10)",
    color: "#E94581",
  },
  statusLinkText: {
    color: Theme.primary,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    fontSize: 12,
    fontStyle: "normal",
    lineHeight: 18,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    marginLeft: 12,
  },
  idText: {
    color: Theme.text[100],
    fontFamily: FontFamily.medium,
    fontWeight: "500",
    fontSize: 12,
    fontStyle: "normal",
    lineHeight: 16,
  },
  textActive: {
    color: Theme.brand.primary,
  },
});

export default HistoryTransactionItem; 
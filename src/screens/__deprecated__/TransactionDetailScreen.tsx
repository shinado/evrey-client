import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { Theme } from '../../constants/Theme';
import { format } from 'date-fns';
import { Colors } from '../../constants/Colors';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import i18n from '../../i18n';


// 类型定义
type TransactionType = 1 | 2 | 3 | 4;
type DetailField = keyof typeof DETAIL_FIELDS;

// 配置
const DETAIL_FIELDS = {
  status: {
    label: i18n.t('transaction.details.status'),
    icon: 'checkbox-marked-circle-outline',
    getValue: (tx: any) => getStatusText(tx.status)
  },
  // entry_price: {
  //   label: 'Entry price',
  //   icon: 'chart-line',
  //   getValue: (tx: any) => `$${tx.entry_price}`
  // },
  // exit_price: {
  //   label: 'Exit price',
  //   icon: 'chart-line',
  //   getValue: (tx: any) => `$${tx.exit_price}`
  // },
  fee: {
    label: i18n.t('transaction.details.fee'),
    icon: 'cash',
    getValue: (tx: any) => `$${Number(tx.trading_fee) / 1000000}`
  },
  // network_fee: {
  //   label: i18n.t('transaction.details.networkFee'),
  //   icon: 'lightning-bolt',
  //   getValue: (tx: any) => `$${Number(tx.trading_fee) / 1000000}`
  // },
  time: {
    label: i18n.t('transaction.details.time'),
    icon: 'clock-outline',
    getValue: (tx: any) => format(new Date(tx.created_at), 'h:mm a - MMM d, yyyy')
  },
  id: {
    label: i18n.t('transaction.details.id'),
    icon: 'pound',
    getValue: (tx: any) => {
      if (tx.status === -1) return i18n.t('transaction.status.failed');
      if (tx.status === 0) return i18n.t('transaction.status.pending');
      // 截取前6位和后4位
      const hash = tx.hash;
      return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    }
  },
  to: {
    label: i18n.t('transaction.details.to'),
    icon: 'account',
    getValue: (tx: any) => tx.to || 'N/A'
  }
} as const;

const TRANSACTION_FIELDS: Record<TransactionType, DetailField[]> = {
  1: ['status', 'fee', 'time', 'id'], // Bought
  2: ['status', 'fee', 'time', 'id'], // Sold
  3: ['status', 'time', 'id'], // Received
  4: ['to', 'status', 'time', 'id'], // Sent
};

// 工具函数
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return i18n.t('transaction.status.pending');
    case 1: return i18n.t('transaction.status.complete');
    case -1: return i18n.t('transaction.status.failed');
    default: return i18n.t('transaction.status.unknown');
  }
};

const TRANSACTION_TYPES = {
  1: i18n.t('history.modes.buy'),
  2: i18n.t('history.modes.sell'),
  3: i18n.t('history.modes.receive'),
  4: i18n.t('history.modes.send'),
} as const;

const getTransactionTitle = (action: number, symbol?: string) => {
  const type = TRANSACTION_TYPES[action as keyof typeof TRANSACTION_TYPES] || 'Transaction';
  return symbol ? `${type} ${symbol}` : type;
};

const TransactionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const transaction = route.params?.transaction;
  const [copiedId, setCopiedId] = useState(false);

  const handleHashPress = async () => {
    if (transaction.hash) {
      const baseUrl = 'https://solscan.io/tx/';
      const url = `${baseUrl}${transaction.hash}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Clipboard.setStringAsync(transaction.hash);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
    }
  };

  const renderTransactionDetails = () => {
    const transactionType = transaction.action as TransactionType;
    const fieldsToDisplay = TRANSACTION_FIELDS[transactionType] ?? [];
    
    return fieldsToDisplay.map((key) => {
      const field = DETAIL_FIELDS[key];
      return (
        <View key={key} style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <MaterialCommunityIcons 
              name={field.icon as any} 
              size={20} 
              color={Theme.secondaryColors[400]} 
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>{field.label}</Text>
          </View>
          {key === 'id' && transaction.status !== -1 ? (
            <TouchableOpacity onPress={handleHashPress}>
              <Text style={[styles.detailLabel, { color: Theme.primaryColors[400], 
                textDecorationLine: copiedId ? 'none' : 'underline' }]}>
                {copiedId ? 'Copied' : field.getValue(transaction)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.detailLabel}>{field.getValue(transaction)}</Text>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTransactionTitle(transaction.action, transaction.mint_info?.attributes?.symbol)}</Text>
      </View>

      <View style={styles.content}>
        {/* Token Icon and Amount */}
        <View style={styles.tokenSection}>
          <Image 
            source={{ uri: transaction.mint_info?.attributes?.image_url }} 
            style={styles.tokenIcon} 
          />
          <Text style={[styles.amount, { 
            color: transaction.action === 1 || transaction.action === 4 
              ? Theme.secondaryColors[400] 
              : Colors.ascend
          }]}>
            {transaction.action === 1 ? '-' : '+'}
            ${(Number(transaction.amount_usdc) / 1000000).toFixed(2)}
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsSection}>
          {renderTransactionDetails()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 16,
    color: Theme.secondaryColors[900],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tokenSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  tokenIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Theme.secondaryColors[400],
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
  },
});

export default TransactionDetailScreen; 
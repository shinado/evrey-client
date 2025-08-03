import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SearchLayout from '../layouts/SearchLayout';
import BottomSheet from './BottomSheet';
import { Theme } from '../constants/Theme';
import { FontFamily } from '../constants/typo';
import TokenIcon from './TokenIcon';
import { Token } from '../types/token';
import { CoinFormatUtil } from '../utils/format';

interface TokenSelectSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (token: Token, isCashToken: boolean) => void;
  cashToken?: Token;
  tokens: Token[];
  title: string;
}

const TokenSelectSheet: React.FC<TokenSelectSheetProps> = ({
  isVisible,
  onClose,
  onSelect,
  cashToken,
  tokens,
  title
}) => {
  const renderTokenItem = (token: Token, isCashToken: boolean = false) => (
    <TouchableOpacity 
      key={token.attributes.address}
      style={styles.tokenItem}
      onPress={() => onSelect(token, isCashToken)}
    >
      {/* 左侧：代币图标和信息 */}
      <View style={styles.tokenInfo}>
        <TokenIcon 
          icon={token.attributes.image}
          size={36}
        />
        <View style={styles.tokenDetails}>
          <Text style={styles.tokenSymbol}>{token.attributes.symbol}</Text>
          <Text style={styles.tokenName}>{token.attributes.name}</Text>
        </View>
      </View>

      {/* 右侧：余额信息 */}
      <View style={styles.balanceContainer}>
        <Text style={styles.tokenBalance}>
          {CoinFormatUtil.formatTokenQuantity(token.account.balance_token.ui_amount)}
        </Text>
        {!isCashToken && (
          <Text style={styles.tokenValue}>
            ${CoinFormatUtil.formatPrice(token.account.balance_usd)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <BottomSheet 
      isVisible={isVisible} 
      onClose={onClose}
      height="50%"
    >
      <SearchLayout 
        title={title} 
        onClose={onClose}
      >
          {/* Token List */}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Cash Token */}
            {cashToken && cashToken.account.balance_token.ui_amount > 0 && renderTokenItem(cashToken, true)}
            {/* Other Tokens */}
            {tokens.map(token => renderTokenItem(token, false))}
          </ScrollView>
      </SearchLayout>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenDetails: {
    marginLeft: 12,
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.semiBold,
  },
  tokenName: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: 16,
    color: Theme.text[300],
    fontFamily: FontFamily.medium,
  },
  tokenValue: {
    fontSize: 12,
    color: Theme.text[100],
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});

export default TokenSelectSheet; 
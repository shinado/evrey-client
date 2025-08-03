export interface UiToken{
  mint: string;
  name: string;
  symbol: string;
  icon: string;
  priceChangePercentage?: string;
  quoteTokenPriceUsd?: string;
  marketCapUsd?: string;
  volume24h?: string;
  decimals: number;
  chain?: string;
}


export interface TokenAttributes {
    id?: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    isActive?: boolean;
    description?: string;
    website?: string;
    tiktok?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    [property: string]: any;
}

export interface TokenData {
  attributes: TokenAttributes;
  priceUSD?: string;
  marketCapUSD?: string;
  totalSupply?: string;
  fdvUsd?: string;
  holdings?: string;
  priceChangePercentageM5?: string;
  priceChangePercentageH1?: string;
  priceChangePercentageH6?: string;
  priceChangePercentageH24?: string;
  priceChangePercentage?: string;
  volumeUSDM5?: string;
  volumeUSDH1?: string;
  volumeUSDH6?: string;
  volumeUSDH24?: string;
  reserveInUSD?: string;
  createdTime?: string;
  circulatingSupply?: string;
  volumeUSD?: string;
  [property: string]: any;
}

export interface TokenBalance {
    amount: string;
    decimals: number;
    ui_amount: number;
    ui_amount_str: string;
}

export interface TokenAccount {
  balance_token: TokenBalance;  
  balance_usd: string;
}

export interface ProfitLoss {
  earnings: string;
  cost: string;
  rate: string;
}


export interface Token extends TokenData {
  account: TokenAccount;
  profit_margin: ProfitLoss;
}

export interface TokenInfo {
  token: TokenData;
  inWatchlist: boolean;
}

export interface CoinKlineData {
  priceUSD?: string;
  priceChangePercentageM5?: string;
  priceChangePercentageH1?: string;
  priceChangePercentageH6?: string;
  priceChangePercentageH24?: string;
  priceChangePercentage?: string;
  volumeUSDM5?: string;
  volumeUSDH1?: string;
  volumeUSDH6?: string;
  volumeUSDH24?: string;
  reserveInUSD?: string;
  ohlcvs: number[][];
}


export interface TokensAggregateData {
  balance_usd: string;
  cash_balance_usd: string;
  cash_balance_amount: string;
  cash_token: Token;
  tokens: Token[];
  profit_margin: ProfitLoss;
}

// 新增余额接口响应类型
export interface BalanceData {
  balance_usd: string;
}

export interface TokenBalanceData {
  balance_token: TokenBalance;
  balance_usd: string;
  price_usd: string;
  profit_margin: ProfitLoss;
}

export const TIMEFRAMES = ['live', '4h', '1d', '1w', '1m', '3m', '1y'] as const;
export type TimeframeKey = typeof TIMEFRAMES[number];

// 修改映射函数以处理可能的空值
export const mapToUiToken = (token: TokenData | Token ): UiToken => {
  return {
    chain: token.attributes.chain || '',
    mint: token.attributes.address,
    name: token.attributes.name,
    symbol: token.attributes.symbol,
    icon: token.attributes.image,
    priceChangePercentage: token.priceChangePercentage || '',
    quoteTokenPriceUsd: token.priceUSD || '',
    marketCapUsd: token.marketCapUSD || token.fdvUsd || '',
    volume24h: token.volumeUSDH24 || token.volumeUSD || '',
    decimals: token.attributes.decimals
  };
};


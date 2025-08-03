import { TokenAttributes, UiTopGainer } from "../types/token";

const topGainers: UiTopGainer[] = [
  {
    id: "1",
    name: "ACT",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 970.33,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "2",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 142.1,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "3",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 235.19,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "4",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: -235.19,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "5",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: -970.33,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
];

const coins: UiTopGainer[] = [
  {
    id: "1",
    name: "ACT",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 970.33,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "2",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 142.1,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "3",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 235.19,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "4",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: -235.19,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "5",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: -970.33,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "6",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 0,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "7",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 0,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
  {
    id: "8",
    name: "Pnut",
    icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    priceChangePercentage: 0,
    marketCapUsd: 64038310.8149232,
    quoteTokenPriceUsd: 174.31071416605209669230463091761771252764454692945514496,
  },
];

const mockToken: TokenAttributes = {
  address: "HdHqKPz3n52e6FCJREKY3MS56TagyvRxsxVYG7E4rF99",
  name: "President Trump",
  symbol: "47",
  decimals: 6,
  image_url:
    "https://coin-images.coingecko.com/coins/images/51066/large/President_Trump.jpg?1729955942",
  coingecko_coin_id: "trump-47",
  total_supply: "844281656873275.0",
  price_usd: "0.00558446",
  fdv_usd: "4714855",
  total_reserve_in_usd:
    "192758.593439063378876856969598163046107579822714104455906165352115577205228259299912914968254",
  volume_usd: {
    h24: "6829631.50290253",
  },
  market_cap_usd: "4750087.00325468",
};

export const MockData = {
  topGainers,
  coins,
  mockToken,
};

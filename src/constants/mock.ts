import { UserInfoData, Media, PostType, UiToken, Token } from "../types";


export const mockUser: UserInfoData = {
    id: "user1",
    referralId: "referral1",
    registerAt: new Date().toISOString(),
    nickname: "UserA",
    username: "usera",
    wallet: "wallet1",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg"
}


export const mockUiToken: UiToken = {
        mint: "0x0000000000000000000000000000000000000000",
        name: "Bitcoin",
        symbol: "BTC",
        icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        decimals: 8,
        chain: "solana",
        quoteTokenPriceUsd: "50000",
        marketCapUsd: "1000000000",
        volume24h: "1000000",
        priceChangePercentage: "5.23",
      }

export const mockTokens: Token[] = [
  {
    attributes: {
      name: "Bitcoin",
      symbol: "BTC",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      address: "0x1111111111111111111111111111111111111111",
      decimals: 8,
    },
    priceChangePercentage: "0.00",
    account: {
      balance_usd: "1000000000",
      balance_token: {
        amount: "2897939",
        decimals: 6,
        ui_amount: 2.897939,
        ui_amount_str: "2.897939"
      },
    },
    profit_margin: {
      earnings: "1000000000",
      cost: "1000000000",
      rate: "0.01",
    },
  },
  {
    attributes: {
      name: "Ethereum",
      symbol: "ETH",
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      address: "0x2222222222222222222222222222222222222222",
      decimals: 18,
    },
    priceChangePercentage: "-9.00",
    account: {
      balance_usd: "1000000000",
      balance_token: {
        amount: "13567890",
        decimals: 8,
        ui_amount: 0.13567890,
        ui_amount_str: "0.13567890",
      },
    },
    profit_margin: {
      earnings: "1000000000",
      cost: "1000000000",
      rate: "0.01",
    },
  },
  {
    attributes: {
      name: "Solana",
      symbol: "SOL",
      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      address: "0x3333333333333333333333333333333333333333",
      decimals: 9,
    },
    priceChangePercentage: "10.00",
    account: {
      balance_usd: "1000000000",
      balance_token: {
        amount: "987654321",
        decimals: 9,
        ui_amount: 0.987654321,
        ui_amount_str: "0.987654321",
      },
    },
    profit_margin: {
      earnings: "1000000000",
      cost: "1000000000",
      rate: "0.01",
    },
  },
  {
    attributes: {
      name: "Tether",
      symbol: "USDT",
      image: "https://assets.coingecko.com/coins/images/325/large/tether.png",
      address: "0x4444444444444444444444444444444444444444",
      decimals: 6,
    },
    priceChangePercentage: "-10.00",
    account: {
      balance_usd: "1000000000",
      balance_token: {
        amount: "1000000000",
        decimals: 6,
        ui_amount: 1000,
        ui_amount_str: "1000",
      },
    },
    profit_margin: {
      earnings: "1000000000",
      cost: "1000000000",
      rate: "0.01",
    },
  },
]

export const mockMedia: Media = {
  images:["https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop"],
}


export const mockViewsData = [
    {
      id: "1",
      title: "Sample Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "bitcoin-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user1",
      favoritesCount: 1234,
      isFavorited: false
    },
    {
      id: "2",
      title: "Another Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "ethereum-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user2",
      favoritesCount: 5678,
      isFavorited: false
    },
    {
      id: "3",
      title: "Another Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "ethereum-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user2",
      favoritesCount: 5678,
      isFavorited: false
    },
    {
      id: "4",
      title: "Another Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "ethereum-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user2",
      favoritesCount: 5678,
      isFavorited: false
    },
    {
      id: "5",
      title: "Another Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "ethereum-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user2",
      favoritesCount: 5678,
      isFavorited: false
    },
    {
      id: "6",
      title: "Another Viewed Post",
      author: mockUser,
      coin: mockUiToken,
      media: mockMedia,
      head_img: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop",
      mint_address: "ethereum-mint-address",
      mint_chain: "solana",
      type: PostType.IMAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user2",
      favoritesCount: 5678,
      isFavorited: false
    }
  ];



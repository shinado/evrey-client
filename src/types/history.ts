export interface FetchCommissionHistoryResponse {
  list: CommissionHistoryItem[];
  has_more: boolean;
  next: number;
}

export interface CommissionHistoryItem {
  id: string;
  postId: string;
  authorId: string;
  tradeId: string;
  tradeUserId: string;
  tradeAt: string;
  tradeType: number;
  tradeAmount: string;
  commissionAmount: string;
  tradeHash: string;
  post: CommissionHistoryPost;
  tradeUser: CommissionHistoryTradeUser;
}

export interface CommissionHistoryPost {
  id: string;
  title: string;
  head_img: string;
  type: number;
  user_id: string;
  mint_chain: string;
  mint_address: string;
  media: {
    images: string[];
  };
  created_at: string;
  updated_at: string;
  language: string;
  favoritesCount: number;
  isFavorited: boolean;
  coin: Coin;
  tradeCount: string;
  tradeAmount: string;
  commissionAmount: string;
}

export interface Coin {
  attributes: Attribute;
  priceUSD: string;
  holdings: string;
  priceChangePercentage: string;
  volumeUSD: string;
}

export interface Attribute {
  id: string;
  chain: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  isActive: boolean;
  description: string;
  createdAt: string;
}

export interface CommissionHistoryTradeUser {
  id: string;
  username: string;
  wallet: string;
  nickname: string;
  avatar: string;
  registerAt: string;
}

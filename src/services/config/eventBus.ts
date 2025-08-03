// src/services/eventBus.ts
import mitt from 'mitt';
import { PostType } from '../../types';

export interface Trade {
  id: string; // 交易ID
  mode: number; // 交易类型, 0: 买入, 1: 卖出, 2: 提现, 3: 转账
  token: string; // 币种地址
  amount?: number; // 交易数量
  bigAmount?: string; // 交易数量(最小单位)
  symbol: string; // 币种符号
  status: 0 | 1 | -1; // 交易状态
  payload?: string; // 交易参数
  error?: string; // 错误信息
  txHash?: string; // 交易哈希
  recipientAddress?: string; // 收款地址
  receiverId?:number; //收款人Uid
  signedTx?: string; // 待签名交易
  proof?: {
    nonce: string;
    signature: string;
  }
  secret?: string;
}


export interface UploadTask {
  id: string;
  files: Array<{
    uri: string;
    _uniqueId: string;
    thumbnailUri?: string;
  }>;
  type: PostType;
  postInfo: {
    title: string;
    content: string;
    mint_address?: string;
  };
}


export interface UploadResult {
  head_img: string;
  media: {
    images?: string[];
    videos?: string[];
  };
}

export type Events = {
  TRADE_NEW: Trade;
  TRADE_UPDATE: Trade;
  UPLOAD_START: UploadTask;
  UPLOAD_PROGRESS: { taskId: string; progress: number };
  UPLOAD_COMPLETE: { taskId: string; result: UploadResult };
  UPLOAD_ERROR: { taskId: string; error: string };
  COMPRESSION_COMPLETE: { taskId: string; files: UploadTask['files'] };
  COMPRESSION_ERROR: { taskId: string; error: string };
}

class EventBus {
  private static instance: ReturnType<typeof mitt<Events>>;

  static getInstance() {
    if (!this.instance) {
      this.instance = mitt<Events>();
    }
    return this.instance;
  }
}

export const eventBus = EventBus.getInstance();
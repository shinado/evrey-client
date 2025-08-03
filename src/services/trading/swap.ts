import { primaryApi } from "../http/apiClient";
import { TradeStatusEnum } from "../../types/trading";
import { extractData } from "../http/responseHandler";


export interface BroadcastData {
  txHash?: string;
  status: TradeStatusEnum;
  error?: string;
}

export interface SwapTokenData {
  signedTx: string;  // 待用户签名的交易
  payload: string;   // 广播提交时需要携带的信息
}

// 修改报价接口返回数据类型
export interface QuoteData {
  outAmount: string;
  slippageBps: number;
  tradingFee: string;
  gasFee: string;
  ataFee: string;
  payload: string; // 之后执行swap提交时，上传该信息
}

// 提现手续费接口返回数据类型
export interface WithdrawFeeData {
  tradingFee: string;  // 交易手续费
  ataFee: string;      // ATA账户费用
  gasFee: string;      // 燃料费
}

export interface WithdrawFeeParams {
  recipientAddress: string;
  mint: string;
  amount: string;
}

export interface WithdrawParams extends WithdrawFeeParams {
  proof: {
    kid: string;
    encrypted: string;
  }
}

export interface TransferFeeParams {
  receiverId: number;
  mint: string;
  amount: string;
}

export interface TransferParams extends TransferFeeParams {
  proof: {
    kid: string;
    encrypted: string;
  }
}

export interface WithdrawResponse {
  signedTx: string;
  payload: string;
  proof: {
    nonce: string;
    signature: string;
  }
}

export interface Keypair{
  id: string;
  publicKey: string;
}


// 添加错误类型定义
export interface TradeError {
  type: 'email' | 'google' | 'insufficient' | 'too_small' | 'insufficient_usdt' | 'insufficient'|'unknown';
  errorMessage: string;
}


const handleTradeError = (error: any): TradeError | null => {
  console.log('Trade error:', error);
  
  // 检查是否是自定义错误对象
  if (error.code) {
    switch (error.code) {
      case 40009:
      case 40008:
      case 40007: // GOOGLE_CODE_ERROR
        return {
          type: 'google',
          errorMessage: error.message
        };
      case 40006: // EMAIL_CODE_ERROR
        return {
          type: 'email',
          errorMessage: error.message
        };
      case 40014: // INSUFFICIENT_BALANCE
        return {
          type: 'insufficient',
          errorMessage: error.message
        };
      case 40015: // INSUFFICIENT_BALANCE
        return {
          type: 'insufficient_usdt',
          errorMessage: error.message
        };
      case 40017: // INSUFFICIENT_BALANCE
        return {
          type: 'too_small',
          errorMessage: error.message
        };
      default:
        return {
          type: 'unknown',
          errorMessage: error.message
        }
    }
  }

  // 如果不是自定义错误，返回 null
  return null;
};

export const swapService = () => {

  // 修改获取报价的方法
  const getQuote = async (
    type: "buy" | "sell",
    chain: string,
    mint: string,
    amount: string,
    slippageBps?: number,
    autoSlippageBps?: boolean,
    postId?: string
  ): Promise<QuoteData> => {
    try {
      console.log("🚀🚀🚀 getQuote params: ", {
        type,
        chain,
        mint,
        amount,
        slippageBps,
        autoSlippageBps,
        postId
      })
      const response = await primaryApi.post(`/coins/trade/swap/quote?type=${type}`, {
        mint: {
          mint,
          chain,
        },
        amount,
        slippageBps,
        autoSlippageBps,
        postId
      });
      console.log('getQuote response: ', response.data);
      return extractData<QuoteData>(response);
    } catch (error) {
      console.error('Failed to get quote:', error);
      throw error;
    }
  };

  // 统一的swap接口
  const swapToken = async (
    payload: string
  ): Promise<SwapTokenData> => {
    console.log('swapToken with payload');
    try {
      const response = await primaryApi.post('/coins/trade/swap', {
        payload
      });
      return extractData<SwapTokenData>(response);
    } catch (error) {
      console.error('Failed to execute swap:', error);
      throw error;
    }
  };
  
  const broadcastTransaction = async (
    signedTx: string,
    payload: string
  ): Promise<BroadcastData> => {
    try {
      // 修改为新的广播接口
      console.log('🚀🚀🚀 broadcastTransaction with signedTx: ', signedTx);
      const response = await primaryApi.post('/coins/trade/broadcast', {
        signedTx,
        payload
      });
      console.log('🚀🚀🚀 broadcastTransaction response: ', response.data);
      const result = extractData<BroadcastData>(response);
      
      console.log('Transaction status:', TradeStatusEnum[result.status]);
      
      return result;
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      throw error;
    }
  };

  const getBroadcastResult = async (txHash: string): Promise<BroadcastData> => {
    try {
      const response = await primaryApi.get(`/coins/trade/broadcast/${txHash}`);
      return extractData<BroadcastData>(response);
    } catch (error) {
      console.error('Failed to get broadcast result:', error);
      throw error;
    }
  };

  // 获取提现手续费
  const getWithdrawFee = async (params: WithdrawFeeParams): Promise<WithdrawFeeData> => {
    try {
      const response = await primaryApi.post('/coins/trade/withdraw/fee', params);
      return extractData<WithdrawFeeData>(response);
    } catch (error) {
      console.error('Failed to get withdraw fee:', error);
      throw error;
    }
  };

  

  const withdraw = async (params: WithdrawParams): Promise<WithdrawResponse> => {
    try {
      const response = await primaryApi.post('/coins/trade/withdraw', params);
      return extractData<WithdrawResponse>(response);
    } catch (error) {
      throw handleTradeError(error);
    }
  };


  const getTransferFee = async (params: TransferFeeParams): Promise<WithdrawFeeData> => {
    try {
      const response = await primaryApi.post('/coins/trade/internal-transfer/fee', params);
      return extractData<WithdrawFeeData>(response);
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      throw error;
    }
  };

  const transfer = async (params: TransferParams): Promise<WithdrawResponse> => {
    try {
      const response = await primaryApi.post('/coins/trade/internal-transfer', params);
      console.log('transfer response: ', response.data);
      return extractData<WithdrawResponse>(response);
    } catch (error) {
      throw handleTradeError(error);
    }
  };
    // 获取 keypair 列表
    const getKeypairList = async (): Promise<Keypair[]> => {
      try {
        const response = await primaryApi.get('/coins/keypair');
        console.log('getKeypairList response🫥🫥🫥🫥: ', response.data);
        return extractData<Keypair[]>(response);
      } catch (error) {
        console.error('Failed to get keypair list:', error);
        throw error;
      }
    };

  return {
    getQuote,
    swapToken,
    broadcastTransaction,
    getBroadcastResult,
    getWithdrawFee,
    withdraw,
    getTransferFee,
    transfer,
    getKeypairList
  };
}; 

import { aiboxApi } from '../http/apiClient';
import { extractData } from '../http/responseHandler';
import { TokensAggregateData, BalanceData, TokenBalanceData } from '../../types/token'

export const balanceService = () => {
  const getTokensAggregate = async (): Promise<TokensAggregateData> => {
    try {
      const response = await aiboxApi.get('/coins/wallet/portfolio');
      //console.log('💰 response', response.data.data.tokens);
      return extractData<TokensAggregateData>(response);
    } catch (error) {
      console.error('Error in getTokensAggregate:', error);
      throw error;
    }
  };

  const getTokenHoldings = async (userId: string): Promise<TokensAggregateData> => {
    try {
      const response = await aiboxApi.get(`/coins/wallet/holdings/${userId}`);
      return extractData<TokensAggregateData>(response);
    } catch (error) {
      console.error('Error in getTokenHoldings:', error);
      throw error;
    }
  };
  
  const getBalance = async (): Promise<BalanceData> => {
    try {
      const response = await aiboxApi.get('/coins/wallet/balance');
      return extractData<BalanceData>(response);
    } catch (error) {
      console.error('Error in getBalance:', error);
      throw error;
    }
  };

  const getTokenBalance = async (mint: string): Promise<TokenBalanceData> => {
    try {
      const response = await aiboxApi.get(`/coins/wallet/balance/solana/${mint}`);
      return extractData<TokenBalanceData>(response);
    } catch (error) {
      console.error('Error in getTokenBalance:', error);
      throw error;
    }
  };
  
  return {
    getBalance,
    getTokensAggregate,
    getTokenBalance,
    getTokenHoldings,
  };
}; 
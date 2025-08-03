import { useQuery } from '@tanstack/react-query';
import { balanceService } from '../services/trading/balance';
import { useTrade } from '../contexts/TradeContext';
import { useEffect } from 'react';
import { queryClient } from '../services';
import { useIsFocused } from '@react-navigation/native';
import { BalanceData, TokensAggregateData, TokenBalanceData } from '../types';

export function useBalance() {
  const isFocused = useIsFocused();
  const { trades } = useTrade();
  
  // 使用 React Query 获取余额数据
  const balanceQuery = useQuery<BalanceData>({
    queryKey: ['balance'],
    queryFn: balanceService().getBalance,
    refetchInterval: isFocused ? 60 * 1000 : false,
    enabled: isFocused,
  });

  // 监听交易状态更新
  useEffect(() => {
    const completedTrades = Array.from(trades.values()).filter(t => t.status === 1);
    if (completedTrades.length > 0) {
      console.log('💰 Trade completed, updating balance...');
      // 交易完成后，使余额查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    }
  }, [trades]);

  // 返回查询对象和一些便捷属性
  return {
    totalBalance: balanceQuery.data?.balance_usd,
    loading: balanceQuery.isLoading,
    refetch: balanceQuery.refetch
  };
} 

export function useTokensAggregate() {
  const isFocused = useIsFocused();
  const { trades } = useTrade();
  const tokensAggregateQuery = useQuery<TokensAggregateData>({
    queryKey: ['tokensAggregate'],
    queryFn: balanceService().getTokensAggregate,
    refetchInterval: isFocused ? 60 * 1000 : false,
    enabled: isFocused,
  });

  // 监听交易状态更新
  useEffect(() => {
    const completedTrades = Array.from(trades.values()).filter(t => t.status === 1);
    if (completedTrades.length > 0) {
      console.log('💰 Trade completed, updating balance...');
      // 交易完成后，使余额查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['tokensAggregate'] });
    }
  }, [trades]);

  return {
    tokensAggregate: tokensAggregateQuery.data,
    loading: tokensAggregateQuery.isLoading,
    refetch: tokensAggregateQuery.refetch
  };
}

export function useTokenBalance(mint: string) {
  const isFocused = useIsFocused();
  const { trades } = useTrade();
  const tokenBalanceQuery = useQuery<TokenBalanceData>({
    queryKey: ['tokenBalance', mint],
    queryFn: () => balanceService().getTokenBalance(mint),
    refetchInterval: isFocused ? 60 * 1000 : false,
    enabled: isFocused,
  });

  // 监听交易状态更新
  useEffect(() => {
    const completedTrades = Array.from(trades.values()).filter(t => t.status === 1);
    if (completedTrades.length > 0) {
      console.log('💰 Trade completed, updating balance...');
      // 交易完成后，使余额查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['tokenBalance', mint] });
    }
  }, [trades]);

  return {
    tokenBalance: tokenBalanceQuery.data,
    loading: tokenBalanceQuery.isLoading,
    refetch: tokenBalanceQuery.refetch
  };
}


export function useTokenHoldings(userId?: string) {
  const isFocused = useIsFocused();
  const tokenHoldingsQuery = useQuery<TokensAggregateData>({
    queryKey: ['tokenHoldings', userId],
    queryFn: () => balanceService().getTokenHoldings(userId || ''),
    refetchInterval: isFocused ? 60 * 1000 : false,
    enabled: isFocused && !!userId,
  });
  return {
    tokenHoldings: tokenHoldingsQuery.data,
    loading: tokenHoldingsQuery.isLoading,
    refetch: tokenHoldingsQuery.refetch
  };
}


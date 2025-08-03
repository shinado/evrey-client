// src/contexts/TradeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventBus, Trade } from '../services/config/eventBus';
import { useToast } from './ToastContext';
import { tradeService } from '../services/trading/transaction';
import i18n from '../i18n';
import { CoinFormatUtil } from '../utils/format';

interface TradeContextType {
  trades: Map<string, Trade>;
}

const TradeContext = createContext<TradeContextType | null>(null);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Map<string, Trade>>(new Map());
  const { showToast } = useToast();

  useEffect(() => {
    const handleNewTrade = async (trade: Trade) => {
      console.log("🚀🚀🚀 handleNewTrade", trade);
      setTrades(prev => new Map(prev).set(trade.id, trade));
      let prefix = '';
      switch(trade.mode) {
        case 0: 
        case 1: prefix = i18n.t('modes.trade'); break;
        case 2: prefix = i18n.t('modes.cashout'); break;
        case 3: prefix = i18n.t('modes.transfer'); break;
        default: break;
      }
      showToast('processing', {message: `${prefix}${i18n.t('toast.processing')}`});

      // 处理交易
      try {
        await tradeService.processTradeTransaction(trade);
      } catch (error) {
        console.error('Trade processing failed:', error);
        // 错误处理已经在 processTradeTransaction 中完成
      }
    };

    const handleTradeUpdate = (trade: Trade) => {
      // 先更新 trades
      setTrades(prev => new Map(prev).set(trade.id, trade));
      let prefix = '';
      switch(trade.mode) {
        case 0: prefix = i18n.t('toast.bought'); break;
        case 1: prefix = i18n.t('toast.sold'); break;
        case 2: prefix = i18n.t('toast.cashedout'); break;
        case 3: prefix = i18n.t('toast.transferred'); break;
        default: break;
      }
      if (trade.status === 1) {
        showToast('success', {
          prefix: `${i18n.t('toast.success', {prefix: prefix, amount: CoinFormatUtil.formatTokenQuantity(trade.amount), symbol: trade.symbol})}`,
          link: {
            text: `${i18n.t('toast.view')}`,
            url: `https://solscan.io/tx/${trade.txHash}`
          }
        });
      } else if (trade.status === -1) {
        showToast('failed', trade.error ? {
          title: `${prefix}${i18n.t('toast.failed')}`, 
          prefix: trade.error
        } : {message: `${prefix}${i18n.t('toast.failed')}`});
      }

      // 延迟移除完成的交易
      if (trade.status !== 0) {
        setTimeout(() => {
          setTrades(prev => {
            const newTrades = new Map(prev);
            newTrades.delete(trade.id);
            return newTrades;
          });
        }, 5000);
      }
    };

    eventBus.on('TRADE_NEW', handleNewTrade);
    eventBus.on('TRADE_UPDATE', handleTradeUpdate);
    return () => {
      eventBus.off('TRADE_NEW', handleNewTrade);
      eventBus.off('TRADE_UPDATE', handleTradeUpdate);
    };
  }, []);

  return (
    <TradeContext.Provider value={{ trades}}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};

export default TradeProvider;
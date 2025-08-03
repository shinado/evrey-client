// src/services/tradeService.ts
import { swapService } from './swap';
import { TradeStatusEnum } from '../../types/trading';
import { cryptoService } from '../wallet';
import { eventBus, Trade } from '../config/eventBus';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { verifySignature } from '../../utils/crypto';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { LoginTypeStorage, LoginType } from '../../storage/auth';


class TradeService {
  private static instance: TradeService;
  private swapService = swapService();
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map(); // 添加定时器 Map


  static getInstance() {
    if (!this.instance) {
      this.instance = new TradeService();
    }
    return this.instance;
  }

  async processTradeTransaction(trade: Trade) {
    try {
      // 获取登录方式
      const loginType = await LoginTypeStorage.getLoginType();
      const isWalletLogin = loginType === LoginType.WALLET;


      let signedResult: any;
      switch (trade.mode) {
        case 0:
        case 1:
          // 2. 获取待签名交易
          signedResult = await this.swapService.swapToken(trade.payload as string);
          break;
        case 2:
          // 提现场景，强制验证签名
          if (!trade.proof || !trade.secret) {
            throw new Error('Missing proof or secret for transaction verification'); // 抛出错误，终止处理
          }
          const isCashoutValid = await verifySignature({
            recipientAddress: trade.recipientAddress,
            mint: trade.token,
            amount: trade.bigAmount as string,
            nonce: trade.proof.nonce,
            signature: trade.proof.signature,
            secret: trade.secret
          });

          console.log("isCashoutValid🫥🫥🫥🫥", isCashoutValid);

          // 强制验证签名
          if (!isCashoutValid) {
            console.error('Transaction data verification failed for trade:', trade); // 打印详细错误信息
            throw new Error('Transaction data verification failed'); // 抛出错误，终止处理
          }
          signedResult = {
            signedTx: trade.signedTx as string,
            payload: trade.payload as string
          };
          break;
        case 3:
          // 提现或转账场景，验证签名
          if (!trade.proof || !trade.secret) {
            throw new Error('Missing proof or secret for transaction verification'); // 抛出错误，终止处理
          }
          const isValid = await verifySignature({
            receiverId: trade.receiverId,
            mint: trade.token,
            amount: trade.bigAmount as string,
            nonce: trade.proof.nonce,
            signature: trade.proof.signature,
            secret: trade.secret
          });

          console.log("isValid🫥🫥🫥🫥", isValid);

          // 强制验证签名
          if (!isValid) {
            console.error('Transaction data verification failed for trade:', trade); // 打印详细错误信息
            throw new Error('Transaction data verification failed'); // 抛出错误，终止处理
          }
          signedResult = {
            signedTx: trade.signedTx as string,
            payload: trade.payload as string
          };
          break;
        default:
          throw new Error('Invalid trade mode');
      }
      // 反序列化并签名交易
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(signedResult.signedTx, "base64")
      );


      let serializedTx = "";
      // 判断用户是邮箱登录还是钱包登录，如果是邮箱登录，使用getStoredKeypair
      if (isWalletLogin) {
        // 连接了钱包，使用@solana-mobile/mobile-wallet-adapter-protocol-web3js 签名交易
        const signedTx = await transact(async (wallet) => {
          // Authorize the wallet session
          const result = await wallet.authorize({
            cluster: 'mainnet-beta', // 或 'devnet' 用于测试
            identity: {
              name: 'Evrey',
              uri: 'https://evrey.app',
              icon: 'favicon.ico', // 可选：应用图标
            },
          });


          if (result && result.accounts && result.accounts.length > 0) {
            const transactionSignatures = await wallet.signAndSendTransactions({
              transactions: [transaction],
            });

            console.log("transactionSignatures:", transactionSignatures[0]);

            return transactionSignatures[0];
          }


          // const signedTxs = await wallet.signTransactions({
          //   transactions: [transaction],
          // });

          // serializedTx = Buffer.from(signedTxs[0].serialize()).toString('base64');
          // console.log("Serialized transaction:", serializedTx);
        });
      } else {
        // 邮箱登录，使用getStoredKeypair
        const wallet = await cryptoService.getStoredKeypair();
        if (!wallet) throw new Error('No wallet found');
        transaction.sign([wallet]);

        serializedTx = Buffer.from(transaction.serialize()).toString('base64');
        console.log("Serialized transaction:", serializedTx);


        // 3. 广播交易
        const result = await this.swapService.broadcastTransaction(
          serializedTx,
          signedResult.payload
        );

        if (result.status === TradeStatusEnum.FAILED) {
          throw new Error(result.error || 'Broadcast failed');
        }

        if (!result.txHash) throw new Error('No txHash returned');
        trade.txHash = result.txHash;
        // 更新交易状态 如果交易成功就不再需要轮询
        if (result.status === TradeStatusEnum.CONFIRMED) {
          trade.status = 1;
          eventBus.emit('TRADE_UPDATE', trade);
          return;
        } else {
          this.startPolling(trade, result.txHash);
        }
      }

    } catch (error: any) {
      trade.status = -1;
      trade.error = error.message;
      eventBus.emit('TRADE_UPDATE', trade);
      throw error;
    }
  }

  private startPolling(trade: Trade, txHash: string) {
    // 先清理同一笔交易的旧定时器
    this.stopPolling(txHash);
    let pollCount = 0;
    const MAX_POLLS = 10;  // 最大轮询次数

    const checkStatus = async () => {
      try {
        pollCount++;
        const result = await this.swapService.getBroadcastResult(txHash);

        // 超过最大轮询次数
        if (pollCount >= MAX_POLLS) {
          trade.status = -1;
          trade.error = '交易确认超时';
          eventBus.emit('TRADE_UPDATE', trade);
          clearInterval(timer);
          return;
        }

        if (result.status === TradeStatusEnum.CONFIRMED) {
          trade.status = 1;
          eventBus.emit('TRADE_UPDATE', trade);
          clearInterval(timer);
        } else if (result.status < 0) {
          trade.status = -1;
          trade.error = result.error;
          console.log("Trade failed:(Polling)", trade.error);
          eventBus.emit('TRADE_UPDATE', trade);
          clearInterval(timer);
        }
      } catch (error: any) {
        console.error('Poll status error:', error);
        // 应该在这里也清理定时器并更新状态
        clearInterval(timer);
        trade.status = -1;
        trade.error = error.message;
        eventBus.emit('TRADE_UPDATE', trade);
      }
    };

    const timer = setInterval(checkStatus, 5000); // 5秒轮询一次
    this.pollingTimers.set(txHash, timer); // 保存定时器引用
  }

  // 停止特定交易的轮询
  private stopPolling(txHash: string) {
    const timer = this.pollingTimers.get(txHash);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(txHash);
    }
  }
}

export const tradeService = TradeService.getInstance();
import React, { useState, useMemo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SendInputScreen from './SendInputScreen';
import RecipientSearchScreen from './RecipientSearchScreen';
import { Token } from '../../../types/token';
import { eventBus, Trade } from '../../../services/config/eventBus';
import { swapService } from '../../../services/trading/swap';
import { useKeypairList } from '../../../hooks/useKeypairList';

export type Recipient = {
  uid: number;
  username: string;
  avatar: string;
};

interface SendScreenProps {
  token: Token;
  onClose: () => void;
}

const SendScreen: React.FC<SendScreenProps> = ({ token, onClose }) => {
  const navigation = useNavigation();
  // 状态管理
  const [view, setView] = useState<'input' | 'search'>('search');
  const [bigAmount, setBigAmount] = useState('');
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const { transfer } = swapService();
  const { createProof } = useKeypairList();

  // 处理发送交易
  const handleSendTransaction = async (bigAmount: string, amount: number): Promise<null> => {
    try {
      console.log("starting creatProof 🫥🫥🫥🫥🫥")
      // 1. 创建加密 proof
      const proof = await createProof();

      console.log("proof🫥🫥🫥🫥", proof);
      
      // 2. 获取待签名交易
      const signedResult = await transfer({
        receiverId: recipient?.uid ?? 0,
        mint: token.attributes.address,
        amount: bigAmount,
        proof: {
          kid: proof.kid,
          encrypted: proof.encrypted
        }
      });

      console.log("signedResult.proof🫥🫥🫥🫥", signedResult.proof);

      // 2. 发送交易到后台处理
      eventBus.emit('TRADE_NEW', {
        id: Date.now().toString(),
        status: 0,
        mode: 3,
        symbol: token.attributes.symbol,
        token: token.attributes.address,
        amount: amount,
        bigAmount: bigAmount,
        receiverId: recipient?.uid,
        payload: signedResult.payload,
        signedTx: signedResult.signedTx,
        proof: signedResult.proof,
        secret: proof.secret
      } as Trade);

      return null;
    } catch (error: any) {
        eventBus.emit('TRADE_UPDATE', {
          id: Date.now().toString(),
          status: -1,
          mode: 3,
          symbol: token.attributes.symbol,
          token: token.attributes.address,
          error: error.errorMessage
        } as Trade);
        onClose();
        return null;
    }
  };

  // 使用 useMemo 缓存当前视图
  const currentScreen = useMemo(() => {
    switch (view) {
      case 'search':
        return (
          <RecipientSearchScreen
            token={token}
            onSelect={(recipient: Recipient) => {
              setRecipient(recipient);
              setView('input');
            }}
            onClose={onClose}
          />
        );

      case 'input':
        return (
          <SendInputScreen
            token={token}
            recipient={recipient as Recipient}
            onClose={onClose}
            onBack={() => setView('search')}
            onConfirm={async (bigAmount: string, amount: number) => {
              setBigAmount(bigAmount);
              setAmount(amount);
              await handleSendTransaction(bigAmount, amount);
              onClose();
            }}
          />
        );
    }
  }, [view, recipient, token, onClose]);

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default SendScreen; 

import { useState, useEffect } from 'react';
import { KeypairStorage } from '../storage';
import { swapService } from '../services/trading/swap';
import { Keypair } from '../services/trading/swap';
import { createEncryptedProof } from '../utils';

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 一周的毫秒数

export function  useKeypairList() {
  const [keypairs, setKeypairs] = useState<Keypair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchKeypairs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. 先从本地存储获取数据
        const localData = await KeypairStorage.getKeypairList();
        
        console.log("localData🫥🫥🫥🫥", localData);
        // 2. 检查是否需要更新
        const needsUpdate = () => {
          if (!localData?.value.length) return true;
          
          const lastUpdateTime = new Date(localData.timestamp).getTime();
          const currentTime = new Date().getTime();
          return currentTime - lastUpdateTime > ONE_WEEK_IN_MS;
        };

        if (needsUpdate()) {
          // 3. 从服务器获取新数据
          const { getKeypairList } = swapService();
          const remoteKeypairs = await getKeypairList();
          
          // 4. 更新本地存储
          await KeypairStorage.setKeypairList(remoteKeypairs);
          
          setKeypairs(remoteKeypairs);
        } else {
          // 使用本地数据
          if (localData) {
            setKeypairs(localData.value);
          }
        }
      } catch (err) {
        console.error('Failed to fetch keypairs:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch keypairs'));
        
        // 如果远程获取失败，尝试使用本地数据
        const localData = await KeypairStorage.getKeypairList();
        if (localData) {
          setKeypairs(localData.value);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchKeypairs();
  }, []);

  const createProof = async () => {
    if (keypairs.length === 0) {
      throw new Error('No keypairs available');
    }
    return await createEncryptedProof(keypairs);
  };

  return {
    keypairs,
    loading,
    error,
    refresh: async () => {
      const { getKeypairList } = swapService();
      const remoteKeypairs = await getKeypairList();
      await KeypairStorage.setKeypairList(remoteKeypairs);
      setKeypairs(remoteKeypairs);
    },
    createProof,
  };
} 
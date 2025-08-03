import { secureStorage, STORAGE_KEYS } from "./config";
import { Keypair } from "../services/trading/swap";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const WalletStorage = {
  async getPrivateKey(): Promise<string | null> {
    try {
      return await secureStorage.getItem(STORAGE_KEYS.SOLANA_PRIVATE_KEY);
    } catch (error) {
      console.error("Failed to get private key:", error);
      return null;
    }
  },

  async setPrivateKey(privateKey: string): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.SOLANA_PRIVATE_KEY, privateKey);
    } catch (error) {
      console.error("Failed to save private key:", error);
    }
  },

  async clearPrivateKey() {
    await secureStorage.removeItem(STORAGE_KEYS.SOLANA_PRIVATE_KEY);
  },
};

interface KeypairWithTimestamp {
  value: Keypair[];
  timestamp: string;
}

export const KeypairStorage = {
  async setKeypairList(value: Keypair[]): Promise<void> {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp: KeypairWithTimestamp = { value, timestamp };
    await AsyncStorage.setItem(STORAGE_KEYS.KEYPAIR_LIST, JSON.stringify(dataWithTimestamp));
  },
  
  async getKeypairList(): Promise<KeypairWithTimestamp | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.KEYPAIR_LIST);
    if (!data) return null;
    return JSON.parse(data);
  },
};
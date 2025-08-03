import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { mnemonicToSeedSync } from 'bip39';
import { HDKey } from 'micro-ed25519-hdkey';
import * as forge from 'node-forge';
import { WalletStorage } from '../storage';
import { Platform } from 'react-native';
import { RSA } from 'react-native-rsa-native';


export const cryptoService = {
  generateRSAKeys: () => {
    return new Promise<{public: string; private: string}>(async (resolve) => {
      try {
        // 在 React Native 环境下使用原生模块
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          const keys = await RSA.generateKeys(2048);
          resolve({
            public: forge.util.encode64(keys.public),
            private: keys.private
          });
        } 
        // 在 Web 环境下使用 forge
        else {
          const keypair = forge.pki.rsa.generateKeyPair({
            bits: 2048,
            e: 0x10001
          });
          
          const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
          const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
          const publicKeyBase64 = forge.util.encode64(publicKeyPem);

          resolve({
            public: publicKeyBase64,
            private: privateKeyPem,
          });
        }
      } catch (error) {
        console.error('RSA key generation error:', error);
        throw error;
      }
    });
  },

  decryptRSAKeys: (encryptedBase64: string, privateKeyPem: string) => {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    // Decode base64 encrypted text to binary
    const encryptedBytes = forge.util.decode64(encryptedBase64);
    //console.log('Decoded encrypted bytes length:', encryptedBytes.length);
    const decryptedBytes = privateKey.decrypt(encryptedBytes, 'RSA-OAEP');
    return forge.util.encodeUtf8(decryptedBytes);
  },

  generateAndStoreKeypair: async (mnemonic: string) => {
    try {
      // 1. 从助记词生成种子
      const seed = mnemonicToSeedSync(mnemonic, "");
      
      // 2. HD钱包方式
      const hd = HDKey.fromMasterSeed(Buffer.from(seed.toString('hex'), 'hex'));
      const path = `m/44'/501'/0'/0'`;
      const keypair = Keypair.fromSeed(hd.derive(path).privateKey as Uint8Array);
      //console.log(`${path} => ${keypair.publicKey.toBase58()}`);

      // 保存私钥
      await WalletStorage.setPrivateKey(bs58.encode(keypair.secretKey));
      return keypair;
    } catch (error) {
      console.error('Generate keypair error:', error);
      throw error;
    }
  },

  getStoredKeypair: async () => {
    const storedPrivateKey = await WalletStorage.getPrivateKey();
    if (!storedPrivateKey) return null;

    // Decode from base58
    const privateKeyBytes = bs58.decode(storedPrivateKey);

    // generate keypair from secret key
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    return keypair;
  },

  getWalletAddress: async () => {
    try {
      const wallet = await cryptoService.getStoredKeypair();
      if (!wallet) {
        return null;
      }
      return wallet.publicKey.toString();
    } catch (error) {
      console.error('Get wallet address error:', error);
      return null;
    }
  },
}; 
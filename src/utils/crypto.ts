import * as forge from 'node-forge';
import * as Crypto from 'expo-crypto';
import { Keypair } from '../services/trading/swap';

interface VerificationParams {
  recipientAddress?: string;
  receiverId?: number;
  mint: string;
  amount: string;
  nonce: string;
  signature: string;
  secret: string;
}

const generateSecret = (length: number = 10): string => {
  const bytes = new Uint8Array(length);
  Crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length);
};

export const createEncryptedProof = async (keypairs: Keypair[]) => {
  const selectedKeypair = keypairs[Math.floor(Math.random() * keypairs.length)];
  if (!selectedKeypair) {
    throw new Error('No keypairs available');
  }

  const secret = generateSecret();
  const publicKeyPem = Buffer.from(selectedKeypair.publicKey, 'base64').toString();
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encrypted = publicKey.encrypt(secret, 'RSA-OAEP');
  const base64Encrypted = forge.util.encode64(encrypted);

  return {
    kid: selectedKeypair.id.toString(),
    encrypted: base64Encrypted,
    secret,
  };
};

export const verifySignature = async ({
  recipientAddress,
  receiverId,
  mint,
  amount,
  nonce,
  signature,
  secret
}: VerificationParams): Promise<boolean> => {
  try {
    const content = receiverId !== undefined 
      ? `${receiverId},${mint},${amount}`
      : `${recipientAddress},${mint},${amount}`;
    const encryptContent = `${content},${nonce}`;

    const hmac = forge.hmac.create();
    hmac.start('sha256', secret);
    hmac.update(encryptContent);
    const calculatedSignature = hmac.digest().toHex();

    return calculatedSignature === signature;
  } catch (error) {
    return false;
  }
};
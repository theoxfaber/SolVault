import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as nacl from 'tweetnacl';
import { derivePath } from 'ed25519-hd-key';
import { WalletAccount } from './wallet-types';

const DERIVATION_PATH = "m/44'/501'/0'/0';

export const generateMnemonic = (): string => {
  return bip39.generateMnemonic(256);
};

export const mnemonicToSeed = async (mnemonic: string): Promise<Buffer> => {
  return await bip39.mnemonicToSeed(mnemonic);
};

export const deriveKeypairFromMnemonic = (mnemonic: string, index: number = 0): Keypair => {
  const seed = bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
  const derivedSeed = derivePath(
    `${DERIVATION_PATH}/${index}'`,
    seed.toString('hex')
  ).key;
  return Keypair.fromSeed(derivedSeed);
};

export const encryptData = (data: string, password: string): { ciphertext: string; iv: string; salt: string } => {
  const salt = nacl.randomBytes(16);
  const key = nacl.pwhash(
    32,
    new TextEncoder().encode(password),
    salt,
    100000,
    32
  );
  
  const iv = nacl.randomBytes(16);
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.secret(
    new TextEncoder().encode(data),
    nonce,
    key
  );

  return {
    ciphertext: Buffer.from(encrypted).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    salt: Buffer.from(salt).toString('base64'),
  };
};

export const decryptData = (encryptedData: { ciphertext: string; iv: string; salt: string }, password: string): string => {
  try {
    const key = nacl.pwhash(
      32,
      new TextEncoder().encode(password),
      Buffer.from(encryptedData.salt, 'base64'),
      100000,
      32
    );
    
    const decrypted = nacl.secret.open(
      Buffer.from(encryptedData.ciphertext, 'base64'),
      Buffer.from(encryptedData.iv, 'base64'),
      key
    );

    if (!decrypted) {
      throw new Error('Failed to decrypt data. Invalid password or corrupted data.');
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Please check your password and try again.');
  }
};

export const createNewAccount = (mnemonic: string, index: number, name: string): WalletAccount => {
  const keypair = deriveKeypairFromMnemonic(mnemonic, index);
  return {
    name: name || `Account ${index + 1}`,
    publicKey: keypair.publicKey.toString(),
    balance: 0,
    isActive: false,
  };
};

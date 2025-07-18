export type WalletAccount = {
  name: string;
  publicKey: string;
  balance: number;
  isActive: boolean;
};

export type EncryptedVault = {
  ciphertext: string;
  iv: string;
  salt: string;
};

export type WalletState = {
  isInitialized: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  accounts: WalletAccount[];
  activeAccount: WalletAccount | null;
  error: string | null;
};

export type WalletContextType = {
  state: WalletState;
  createWallet: (password: string, accountName?: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  lockWallet: () => void;
  sendSol: (toAddress: string, amount: number) => Promise<string>;
  createNewAccount: (name: string) => Promise<void>;
  switchAccount: (publicKey: string) => void;
};

export const WALLET_STORAGE_KEY = 'webwallet-encrypted-vault';
export const ACTIVE_ACCOUNT_KEY = 'webwallet-active-account';

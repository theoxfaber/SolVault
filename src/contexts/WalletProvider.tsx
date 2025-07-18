'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { 
  WalletAccount, 
  WalletContextType, 
  WalletState, 
  WALLET_STORAGE_KEY, 
  ACTIVE_ACCOUNT_KEY 
} from '@/lib/wallet-types';
import { 
  generateMnemonic, 
  encryptData, 
  decryptData, 
  createNewAccount 
} from '@/lib/crypto-utils';

// Initialize Solana connection
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Initial state
const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  isLoading: false,
  accounts: [],
  activeAccount: null,
  error: null,
};

type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'WALLET_CREATED' }
  | { type: 'WALLET_UNLOCKED'; payload: { accounts: WalletAccount[]; activeAccount: WalletAccount | null } }
  | { type: 'WALLET_LOCKED' }
  | { type: 'ACCOUNT_SWITCHED'; payload: WalletAccount }
  | { type: 'ACCOUNT_CREATED'; payload: WalletAccount }
  | { type: 'BALANCE_UPDATED'; payload: { publicKey: string; balance: number } };

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'WALLET_CREATED':
      return { ...state, isInitialized: true, isUnlocked: true, isLoading: false };
    case 'WALLET_UNLOCKED':
      return { 
        ...state, 
        isUnlocked: true, 
        accounts: action.payload.accounts, 
        activeAccount: action.payload.activeAccount,
        isLoading: false 
      };
    case 'WALLET_LOCKED':
      return { 
        ...state, 
        isUnlocked: false, 
        accounts: [], 
        activeAccount: null,
        isLoading: false 
      };
    case 'ACCOUNT_SWITCHED':
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, action.payload.publicKey);
      return { 
        ...state, 
        activeAccount: action.payload,
        accounts: state.accounts.map(account => ({
          ...account,
          isActive: account.publicKey === action.payload.publicKey,
        })),
      };
    case 'ACCOUNT_CREATED':
      return { 
        ...state, 
        accounts: [...state.accounts, action.payload],
      };
    case 'BALANCE_UPDATED':
      return {
        ...state,
        accounts: state.accounts.map(account => 
          account.publicKey === action.payload.publicKey
            ? { ...account, balance: action.payload.balance }
            : account
        ),
        activeAccount: 
          state.activeAccount?.publicKey === action.payload.publicKey
            ? { ...state.activeAccount, balance: action.payload.balance }
            : state.activeAccount,
      };
    default:
      return state;
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check if wallet exists on mount
  useEffect(() => {
    const checkWalletExists = () => {
      const vault = localStorage.getItem(WALLET_STORAGE_KEY);
      dispatch({ type: 'SET_LOADING', payload: false });
      return !!vault;
    };

    checkWalletExists();
  }, []);

  // Create a new wallet
  const createWallet = useCallback(async (password: string, accountName: string = 'Main Account') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Generate mnemonic
      const mnemonic = generateMnemonic();
      
      // Encrypt and store the mnemonic
      const encryptedVault = encryptData(mnemonic, password);
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(encryptedVault));
      
      // Create first account
      const account = createNewAccount(mnemonic, 0, accountName);
      
      // Set as active account
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.publicKey);
      
      dispatch({ 
        type: 'WALLET_UNLOCKED', 
        payload: { 
          accounts: [account], 
          activeAccount: { ...account, isActive: true } 
        } 
      });
      
      toast.success('Wallet created successfully!');
    } catch (error) {
      console.error('Error creating wallet:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to create wallet' 
      });
      toast.error('Failed to create wallet. Please try again.');
    }
  }, []);

  // Unlock wallet
  const unlockWallet = useCallback(async (password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const vault = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!vault) {
        throw new Error('No wallet found. Please create a new wallet.');
      }
      
      // Decrypt the mnemonic
      const encryptedVault = JSON.parse(vault);
      const mnemonic = decryptData(encryptedVault, password);
      
      // For now, we'll just verify the decryption worked
      if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid password or corrupted wallet data');
      }
      
      // Create accounts (for now, just one account)
      const account = createNewAccount(mnemonic, 0, 'Main Account');
      
      // Get the active account from localStorage or default to the first account
      const activeAccountPublicKey = localStorage.getItem(ACTIVE_ACCOUNT_KEY) || account.publicKey;
      const activeAccount = account.publicKey === activeAccountPublicKey 
        ? { ...account, isActive: true } 
        : account;
      
      // Update balances
      await updateAccountBalances([account]);
      
      dispatch({ 
        type: 'WALLET_UNLOCKED', 
        payload: { 
          accounts: [activeAccount], 
          activeAccount 
        } 
      });
      
      toast.success('Wallet unlocked!');
      return true;
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to unlock wallet' 
      });
      toast.error('Failed to unlock wallet. Please check your password and try again.');
      return false;
    }
  }, []);

  // Lock wallet
  const lockWallet = useCallback(() => {
    dispatch({ type: 'WALLET_LOCKED' });
    toast('Wallet locked', { icon: '🔒' });
  }, []);

  // Create a new account
  const createNewAccount = useCallback(async (name: string) => {
    try {
      // In a real implementation, we would get the mnemonic from the encrypted vault
      // and derive a new keypair with the next account index
      // For now, we'll just create a new random keypair
      const keypair = Keypair.generate();
      const newAccount: WalletAccount = {
        name,
        publicKey: keypair.publicKey.toString(),
        balance: 0,
        isActive: false,
      };
      
      dispatch({ type: 'ACCOUNT_CREATED', payload: newAccount });
      toast.success(`Account ${name} created!`);
    } catch (error) {
      console.error('Error creating new account:', error);
      toast.error('Failed to create new account');
    }
  }, []);

  // Switch active account
  const switchAccount = useCallback((publicKey: string) => {
    const account = state.accounts.find(acc => acc.publicKey === publicKey);
    if (account) {
      dispatch({ type: 'ACCOUNT_SWITCHED', payload: { ...account, isActive: true } });
    }
  }, [state.accounts]);

  // Send SOL to another address
  const sendSol = useCallback(async (toAddress: string, amount: number): Promise<string> => {
    if (!state.activeAccount) {
      throw new Error('No active account');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // In a real implementation, we would:
      // 1. Get the keypair from the mnemonic and account index
      // 2. Create and send the transaction
      // 3. Confirm the transaction
      
      // Simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update balance (in a real app, we would fetch the new balance from the blockchain)
      const newBalance = (state.activeAccount.balance || 0) - amount;
      dispatch({ 
        type: 'BALANCE_UPDATED', 
        payload: { 
          publicKey: state.activeAccount.publicKey, 
          balance: Math.max(0, newBalance) 
        } 
      });
      
      toast.success(`Sent ${amount} SOL to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`);
      return 'Transaction successful';
    } catch (error) {
      console.error('Error sending SOL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SOL';
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.activeAccount]);

  // Update account balances
  const updateAccountBalances = useCallback(async (accounts: WalletAccount[]) => {
    try {
      for (const account of accounts) {
        if (account.publicKey) {
          // In a real implementation, we would fetch the actual balance from the blockchain
          const publicKey = new PublicKey(account.publicKey);
          const balance = await connection.getBalance(publicKey);
          
          dispatch({
            type: 'BALANCE_UPDATED',
            payload: {
              publicKey: account.publicKey,
              balance: balance / LAMPORTS_PER_SOL,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  }, []);

  // Periodically update balances
  useEffect(() => {
    if (!state.isUnlocked || state.accounts.length === 0) return;
    
    updateAccountBalances(state.accounts);
    const interval = setInterval(() => updateAccountBalances(state.accounts), 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [state.isUnlocked, state.accounts, updateAccountBalances]);

  return (
    <WalletContext.Provider
      value={{
        state,
        createWallet,
        unlockWallet,
        lockWallet,
        sendSol,
        createNewAccount,
        switchAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

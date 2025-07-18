import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { fadeIn, slideUp, staggerHalf } from '@/lib/utils';
import { formatAddress, formatSol } from '@/lib/utils';
import { FiCopy, FiLogOut, FiPlus, FiSend, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { state, lockWallet, createNewAccount, sendSol } = useWallet();
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  
  const activeAccount = state.activeAccount;
  
  const handleCopyAddress = () => {
    if (!activeAccount) return;
    navigator.clipboard.writeText(activeAccount.publicKey);
    toast.success('Address copied to clipboard');
  };
  
  const handleSendSol = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeAccount) return;
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > (activeAccount.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (!recipientAddress) {
      toast.error('Please enter a recipient address');
      return;
    }
    
    try {
      setIsSending(true);
      await sendSol(recipientAddress, amount);
      setShowSendModal(false);
      setSendAmount('');
      setRecipientAddress('');
    } catch (error) {
      console.error('Error sending SOL:', error);
      toast.error('Failed to send SOL. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleAddAccount = async () => {
    const accountName = prompt('Enter a name for the new account:');
    if (accountName) {
      await createNewAccount(accountName);
    }
  };

  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No active account</h2>
          <p className="text-zinc-400 mb-6">Please create or unlock a wallet to continue</p>
          <Button onClick={() => window.location.reload()}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
              <span className="font-bold">W</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
              WebWallet
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddAccount}
              className="hidden sm:flex items-center space-x-1"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Account</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={lockWallet}
              className="flex items-center space-x-1 text-zinc-400 hover:text-white"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Account Overview */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Account</p>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold">{activeAccount.name}</h2>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyAddress}
                  className="text-zinc-400 hover:text-white"
                >
                  {formatAddress(activeAccount.publicKey)}
                  <FiCopy className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                {formatSol(activeAccount.balance || 0)} SOL
              </div>
              <p className="text-sm text-zinc-400">≈ ${(Number(activeAccount.balance || 0) * 150).toFixed(2)} USD</p>
            </CardContent>
            
            <CardFooter className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowSendModal(true)}
              >
                <FiSend className="mr-2 w-4 h-4" />
                Send
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  // Placeholder for receive functionality
                  navigator.clipboard.writeText(activeAccount.publicKey);
                  toast.success('Address copied to clipboard');
                }}
              >
                <FiCopy className="mr-2 w-4 h-4" />
                Receive
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
        
        {/* Token List */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Assets</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    // Placeholder for refresh functionality
                    toast.success('Balances refreshed');
                  }}
                >
                  <FiRefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* SOL Token */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center">
                      <span className="font-bold text-white">SOL</span>
                    </div>
                    <div>
                      <p className="font-medium">Solana</p>
                      <p className="text-sm text-zinc-400">SOL</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatSol(activeAccount.balance || 0)}</p>
                    <p className="text-sm text-zinc-400">
                      ${(Number(activeAccount.balance || 0) * 150).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {/* Empty state for additional tokens */}
                <div className="text-center py-8">
                  <p className="text-zinc-500">No other tokens found</p>
                  <p className="text-sm text-zinc-600 mt-1">
                    You can receive tokens by sharing your address
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      {/* Send SOL Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSendModal(false)}
          >
            <motion.div 
              className="w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Send SOL</h3>
                
                <form onSubmit={handleSendSol} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Enter Solana address"
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-zinc-300">
                        Amount
                      </label>
                      <span className="text-xs text-zinc-500">
                        Available: {formatSol(activeAccount.balance || 0)} SOL
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={activeAccount.balance}
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 pr-16 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-sky-400 font-medium">
                        SOL
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSending}
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-800 flex justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSendModal(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

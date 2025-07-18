import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import CreateWalletForm from './CreateWalletForm';
import UnlockWalletForm from './UnlockWalletForm';
import { fadeIn, slideUp } from '@/lib/utils';

const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('unlock');
  const [showContent, setShowContent] = useState(false);

  // Add a small delay before showing content for a smoother initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if there's an existing wallet to determine the default tab
  useEffect(() => {
    const vault = localStorage.getItem('webwallet-encrypted-vault');
    setActiveTab(vault ? 'unlock' : 'create');
  }, []);

  if (!showContent) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="p-1">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
                defaultValue="unlock"
              >
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 p-1 rounded-lg">
                  <TabsTrigger value="unlock">Unlock</TabsTrigger>
                  <TabsTrigger value="create">Create</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="unlock">
                    <UnlockWalletForm />
                  </TabsContent>
                  
                  <TabsContent value="create">
                    <CreateWalletForm />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <div className="absolute inset-0 -z-10 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500 to-transparent opacity-20" />
            </div>
            
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-20 left-1/4 w-60 h-60 bg-pink-500/20 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
          </Card>
          
          <motion.div 
            className="mt-8 text-center text-zinc-500 text-sm"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            <p>WebWallet - Your Gateway to the Solana Ecosystem</p>
            <p className="mt-1 text-xs">v1.0.0</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AuthScreen;

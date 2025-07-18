'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@/contexts/WalletProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, pageVariants, pageTransition } from '@/lib/animations';

// Dynamically import components to avoid SSR issues with Web3
const AuthScreen = dynamic(() => import('@/components/auth/AuthScreen'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-t-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

const Dashboard = dynamic(() => import('@/components/dashboard/Dashboard'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-t-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

const LoadingSpinner = () => (
  <motion.div 
    className="flex items-center justify-center w-full h-screen bg-zinc-900"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-t-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-zinc-900 rounded-full"></div>
        </div>
      </div>
      <motion.p 
        className="text-sm font-medium text-zinc-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Loading WebWallet...
      </motion.p>
    </div>
  </motion.div>
);

export default function Home() {
  const { state } = useWallet();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show the appropriate screen based on authentication state
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={state.isUnlocked ? 'dashboard' : 'auth'}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 text-zinc-100"
      >
        {isClient && (
          <>
            {!state.isUnlocked ? (
              <AuthScreen />
            ) : (
              <Dashboard />
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

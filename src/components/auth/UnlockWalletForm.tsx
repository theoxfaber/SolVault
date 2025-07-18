import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp, staggerHalf } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const UnlockWalletForm: React.FC = () => {
  const { unlockWallet, state } = useWallet();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const success = await unlockWallet(password);
      
      if (!success) {
        toast.error('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      toast.error('Failed to unlock wallet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-md mx-auto"
      variants={staggerHalf}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-center text-zinc-400 mb-8">
          Unlock your wallet to continue
        </p>
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<FiLock className="text-zinc-500" />}
          rightIcon={
            showPassword ? (
              <FiEyeOff 
                className="text-zinc-500 cursor-pointer hover:text-zinc-300" 
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FiEye 
                className="text-zinc-500 cursor-pointer hover:text-zinc-300" 
                onClick={() => setShowPassword(true)}
              />
            )
          }
          required
        />
      </motion.div>
      
      <motion.div variants={fadeInUp} className="pt-2">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          isLoading={isSubmitting || state.isLoading}
          disabled={isSubmitting || state.isLoading}
          magnetic
        >
          Unlock Wallet
        </Button>
      </motion.div>
      
      <motion.div 
        variants={fadeInUp}
        className="text-center text-sm text-zinc-400 pt-4"
      >
        <p className="text-zinc-500">
          Forgot your password? <span className="text-sky-500 hover:text-sky-400 cursor-pointer">Recover wallet</span>
        </p>
      </motion.div>
    </motion.form>
  );
};

export default UnlockWalletForm;

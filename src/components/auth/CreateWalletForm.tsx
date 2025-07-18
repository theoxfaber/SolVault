import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp, staggerHalf } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';

const CreateWalletForm: React.FC = () => {
  const { createWallet, state } = useWallet();
  const [formData, setFormData] = useState({
    accountName: 'Main Account',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createWallet(formData.password, formData.accountName);
      // The WalletProvider will handle the success state and redirect
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('Failed to create wallet. Please try again.');
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
        <Input
          id="accountName"
          name="accountName"
          type="text"
          label="Account Name"
          placeholder="Enter account name"
          value={formData.accountName}
          onChange={handleChange}
          leftIcon={<FiUser className="text-zinc-500" />}
          required
        />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter password (min 8 characters)"
          value={formData.password}
          onChange={handleChange}
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
          minLength={8}
          required
        />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={<FiLock className="text-zinc-500" />}
          rightIcon={
            showConfirmPassword ? (
              <FiEyeOff 
                className="text-zinc-500 cursor-pointer hover:text-zinc-300" 
                onClick={() => setShowConfirmPassword(false)}
              />
            ) : (
              <FiEye 
                className="text-zinc-500 cursor-pointer hover:text-zinc-300" 
                onClick={() => setShowConfirmPassword(true)}
              />
            )
          }
          minLength={8}
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
          Create Wallet
        </Button>
      </motion.div>
      
      <motion.div 
        variants={fadeInUp}
        className="text-center text-sm text-zinc-400 pt-4"
      >
        <p>By creating a wallet, you agree to our Terms of Service and Privacy Policy.</p>
      </motion.div>
    </motion.form>
  );
};

export default CreateWalletForm;

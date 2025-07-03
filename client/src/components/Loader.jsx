import React, { useState, useEffect } from 'react'

import { loader } from '../assets';

const Loader = ({ 
  message = "Transaction is in progress", 
  subMessage = "Please wait...",
  showProgress = false,
  timeout = null,
  onTimeout = null
}) => {
  const [dots, setDots] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeout);

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Timeout handling
  useEffect(() => {
    if (!timeout) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout && onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeout, onTimeout]);

  return (
    <div className="fixed inset-0 z-50 h-screen bg-[rgba(0,0,0,0.8)] flex items-center justify-center flex-col backdrop-blur-sm">
      {/* Loader Animation */}
      <div className="relative">
        <img 
          src={loader} 
          alt="loader" 
          className="w-[100px] h-[100px] object-contain animate-spin"
          onError={(e) => {
            // Fallback to CSS spinner if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        
        {/* Fallback CSS Spinner */}
        <div 
          className="hidden w-[100px] h-[100px] border-4 border-[#3a3a43] border-t-[#8c6dfd] rounded-full animate-spin"
          style={{ display: 'none' }}
        />
        
        {/* Pulsing Ring */}
        <div className="absolute inset-0 w-[100px] h-[100px] border-2 border-[#8c6dfd] rounded-full animate-ping opacity-20" />
      </div>

      {/* Loading Text */}
      <div className="mt-[20px] text-center max-w-[300px]">
        <p className="font-epilogue font-bold text-[20px] text-white">
          {message}{dots}
        </p>
        <p className="mt-[8px] font-epilogue font-normal text-[14px] text-[#808191]">
          {subMessage}
        </p>
        
        {/* Progress Indicator */}
        {showProgress && (
          <div className="mt-[16px] w-full bg-[#3a3a43] rounded-full h-2">
            <div className="bg-[#8c6dfd] h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        
        {/* Timeout Counter */}
        {timeout && timeLeft > 0 && (
          <p className="mt-[12px] font-epilogue font-normal text-[12px] text-[#606060]">
            Timeout in {timeLeft}s
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-[30px] text-center max-w-[400px] px-4">
        <p className="font-epilogue font-normal text-[12px] text-[#606060] leading-[18px]">
          🔒 Secure transaction in progress. Do not close this window or refresh the page.
        </p>
      </div>
    </div>
  )
}

// Specific loader variants for different use cases
export const TransactionLoader = () => (
  <Loader 
    message="Processing Transaction"
    subMessage="Confirm the transaction in your wallet"
    timeout={120}
    onTimeout={() => console.log('Transaction timeout')}
  />
);

export const DataLoader = () => (
  <Loader 
    message="Loading Data"
    subMessage="Fetching campaign information"
    showProgress={true}
  />
);

export const DonationLoader = () => (
  <Loader 
    message="Processing Donation"
    subMessage="Your contribution is being processed"
    timeout={180}
  />
);

export default Loader
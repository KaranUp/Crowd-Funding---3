import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ethers } from 'ethers';

import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { thirdweb } from '../assets';

const CampaignDetails = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address, getCampaigns } = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [donators, setDonators] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingDonators, setLoadingDonators] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(false);

  // Use state from navigation or fetch from contract
  const campaignData = state || campaign;

  // Function to get campaign by specific ID
  const getCampaignById = async (campaignId) => {
    if (!contract) return null;
    
    try {
      const campaigns = await contract.call("getCampaigns");
      const parsedCampaigns = campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i
      }));
      
      return parsedCampaigns.find(camp => camp.pId === parseInt(campaignId));
    } catch (error) {
      console.error('Error getting campaign by ID:', error);
      throw error;
    }
  };

  // Fetch campaign function
  const fetchCampaign = async () => {
    if (!contract || !id) return;
    
    try {
      setLoadingCampaign(true);
      setError('');
      
      const foundCampaign = await getCampaignById(id);
      
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // Fallback: try getting all campaigns
        try {
          const campaigns = await getCampaigns();
          const fallbackCampaign = campaigns.find(camp => camp.pId === parseInt(id));
          
          if (fallbackCampaign) {
            setCampaign(fallbackCampaign);
          } else {
            setError('Campaign not found');
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
          setError('Campaign not found');
        }
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Failed to load campaign details. Please try again.');
    } finally {
      setLoadingCampaign(false);
    }
  };

  // Fetch donators function
  const fetchDonators = async () => {
    if (!campaignData?.pId && campaignData?.pId !== 0) return;
    
    try {
      setLoadingDonators(true);
      const data = await getDonations(campaignData.pId);
      setDonators(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching donators:', err);
      setDonators([]);
    } finally {
      setLoadingDonators(false);
    }
  };

  // Helper to parse and format campaign data
  const parseCampaignData = (campaign) => {
    if (!campaign) return null;

    const formatValue = (value) => {
      if (typeof value === 'string' && value.includes('.')) {
        // Already formatted string
        return value;
      }
      try {
        return ethers.utils.formatEther(value.toString());
      } catch {
        return '0.0';
      }
    };

    return {
      ...campaign,
      target: formatValue(campaign.target),
      amountCollected: formatValue(campaign.amountCollected),
      deadline: typeof campaign.deadline === 'object' && campaign.deadline.toNumber ? campaign.deadline.toNumber() : campaign.deadline,
    };
  };

  // Initialize component
  useEffect(() => {
    if (contract && id) {
      // If we have state data, parse and format it before setting, then still fetch fresh data
      if (state) {
        setCampaign(parseCampaignData(state));
      }
      fetchCampaign();
    }
  }, [contract, id, state]); // Added state to dependencies

  // Fetch donators when campaign data is available
  useEffect(() => {
    if ((campaignData?.pId !== undefined || campaignData?.pId === 0) && contract) {
      fetchDonators();
    }
  }, [contract, campaignData?.pId]);

  // Format ETH values for display
  const formatEthValue = (value) => {
    try {
      if (!value) return '0.0000';
      if (typeof value === 'string' && value.includes('.')) {
        // Already formatted
        return parseFloat(value).toFixed(4);
      }
      return parseFloat(ethers.utils.formatEther(value || '0')).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  // Validation functions
  const validateAmount = (value) => {
    if (!value || value === '') return 'Please enter an amount';
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 'Please enter a valid positive number';
    if (numValue < 0.001) return 'Minimum donation is 0.001 ETH';
    return '';
  };

  // Handle donation
  const handleDonate = async () => {
    try {
      // Clear previous errors
      setDonateError('');
      setSuccess('');

      // Validate amount
      const amountError = validateAmount(amount);
      if (amountError) {
        setDonateError(amountError);
        return;
      }

      // Check if campaign is expired
      const remainingDays = daysLeft(campaignData.deadline);
      if (remainingDays <= 0) {
        setDonateError('This campaign has expired and no longer accepts donations.');
        return;
      }

      // Check if user is connected
      if (!address) {
        setDonateError('Please connect your wallet to donate.');
        return;
      }

      // Check if user is trying to donate to their own campaign
      if (address.toLowerCase() === campaignData.owner.toLowerCase()) {
        setDonateError('You cannot donate to your own campaign.');
        return;
      }

      setIsLoading(true);
      await donate(campaignData.pId, amount);
      
      setSuccess(`Successfully donated ${amount} ETH! Thank you for your support.`);
      setAmount('');
      
      // Refresh donators list and campaign data
      await Promise.all([fetchDonators(), fetchCampaign()]);
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Donation error:', err);
      
      // Handle specific error types
      if (err.code === 4001) {
        setDonateError('Transaction was cancelled by user.');
      } else if (err.code === -32603) {
        setDonateError('Transaction failed. You may not have enough ETH for gas fees.');
      } else if (err.message?.includes('insufficient funds')) {
        setDonateError('Insufficient funds for this donation and gas fees.');
      } else {
        setDonateError(err.message || 'Donation failed. Please try again or check your wallet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear errors when user starts typing
    if (donateError) {
      setDonateError('');
    }
  };

  // Show loading only when fetching campaign data
  if (loadingCampaign && !campaignData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  // Show error state
  if (!campaignData && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="font-epilogue font-bold text-[24px] text-white mb-4">
            {error}
          </h2>
          <p className="font-epilogue text-[16px] text-[#808191] mb-6">
            The campaign you're looking for doesn't exist or couldn't be loaded.
          </p>
          <div className="flex gap-4 justify-center">
            <CustomButton 
              btnType="button"
              title="Retry"
              styles="bg-[#8c6dfd] px-6"
              handleClick={() => {
                setError('');
                fetchCampaign();
              }}
            />
            <CustomButton 
              btnType="button"
              title="Back to Campaigns"
              styles="bg-[#4b5264] px-6"
              handleClick={() => navigate('/')}
            />
          </div>
        </div>
      </div>
    );
  }

  // If we still don't have campaign data and we're not loading, show a minimal loading state
  if (!campaignData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8c6dfd] mx-auto mb-4"></div>
          <p className="text-[#808191]">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  const remainingDays = daysLeft(campaignData.deadline);
  const isExpired = remainingDays <= 0;
  const progressPercentage = calculateBarPercentage(campaignData.target, campaignData.amountCollected);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Show donation loading overlay only when actually donating */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1c1c24] p-6 rounded-lg">
            <Loader />
            <p className="text-white text-center mt-4">Processing donation...</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="font-epilogue text-green-400 text-center">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="font-epilogue text-red-400">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          {/* Campaign Image */}
          <div className="relative">
            <img 
              src={campaignData.image} 
              alt="campaign" 
              className="w-full h-[410px] object-cover rounded-xl"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x410?text=Campaign+Image';
              }}
            />
            {isExpired && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Expired
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-[#4acd8d] transition-all duration-300 ease-out" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          {/* Progress Percentage */}
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-[#808191]">{progressPercentage.toFixed(1)}% funded</span>
            <span className="text-[#808191]">
              {formatEthValue(campaignData.amountCollected)} / {formatEthValue(campaignData.target)} ETH
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox 
            title="Days Left" 
            value={isExpired ? "Expired" : remainingDays} 
          />
          <CountBox 
            title={`Raised of ${formatEthValue(campaignData.target)} ETH`} 
            value={`${formatEthValue(campaignData.amountCollected)} ETH`} 
          />
          <CountBox 
            title="Total Backers" 
            value={donators.length} 
          />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          {/* Creator Section */}
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Creator</h4>
            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img src={thirdweb} alt="user" className="w-[60%] h-[60%] object-contain"/>
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">
                  {campaignData.owner || 'Unknown'}
                </h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]">
                  Campaign Creator
                </p>
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Story</h4>
            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] text-justify">
                {campaignData.description || 'No description provided for this campaign.'}
              </p>
            </div>
          </div>

          {/* Donators Section */}
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Donators ({donators.length})
            </h4>
            <div className="mt-[20px] flex flex-col gap-4">
              {loadingDonators ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8c6dfd]"></div>
                  <span className="ml-3 text-[#808191]">Loading donators...</span>
                </div>
              ) : donators.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {donators.map((item, index) => (
                    <div key={`${item.donator}-${index}`} className="flex justify-between items-center gap-4 py-2 border-b border-[#3a3a43] last:border-b-0">
                      <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd] leading-[26px] break-all">
                        {index + 1}. {item.donator}
                      </p>
                      <p className="font-epilogue text-[16px] text-[#4acd8d] leading-[26px] whitespace-nowrap font-medium">
                        {formatEthValue(item.donation)} ETH
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px]">
                    No donators yet. Be the first one! 🚀
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Fund</h4>   

          <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px] border border-[#3a3a43]">
            <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[#808191]">
              Fund the campaign
            </p>

            {isExpired && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400 text-center text-sm">
                  This campaign has expired and no longer accepts donations.
                </p>
              </div>
            )}

            <div className="mt-[30px]">
              <input 
                type="number"
                placeholder="ETH 0.1"
                step="0.001"
                min="0.001"
                className={`w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] ${
                  donateError ? 'border-red-500' : 'border-[#3a3a43] focus:border-[#8c6dfd]'
                } bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px] transition-colors`}
                value={amount}
                onChange={handleAmountChange}
                disabled={isExpired || isLoading}
              />

              {donateError && (
                <p className="mt-2 text-red-400 text-sm font-epilogue">{donateError}</p>
              )}

              <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px] border border-[#2a2a2a]">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">
                  Back it because you believe in it.
                </h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">
                  Support the project for no reward, just because it speaks to you.
                </p>
              </div>

              <CustomButton 
                btnType="button"
                title={isLoading ? "Processing..." : "Fund Campaign"}
                styles={`w-full ${
                  isExpired || !amount || isLoading 
                    ? 'bg-[#4b5264] cursor-not-allowed' 
                    : 'bg-[#8c6dfd] hover:bg-[#7c5dfd]'
                } transition-colors`}
                handleClick={handleDonate}
                disabled={isExpired || !amount || isLoading}
              />

              {!address && (
                <p className="mt-3 text-center text-[#808191] text-sm">
                  Connect your wallet to donate
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignDetails
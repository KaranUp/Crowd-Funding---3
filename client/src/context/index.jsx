import React, { useContext, createContext, useState, useEffect } from 'react';
import { useAddress, useContract, useConnect, useContractWrite, metamaskWallet } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

// Contract address from environment or fallback
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Validate contract address
if (!ethers.utils.isAddress(CONTRACT_ADDRESS)) {
  console.error('Invalid contract addres:', CONTRACT_ADDRESS);
}

export const StateContextProvider = ({ children }) => {
  const { contract, isLoading: contractLoading, error: contractError } = useContract(CONTRACT_ADDRESS);
  const { mutateAsync: createCampaignContract } = useContractWrite(contract, 'createCampaign');
  const { mutateAsync: deleteCampaignContract } = useContractWrite(contract, 'deleteCampaign');
  const address = useAddress();
  const connect = useConnect();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  
  // Debug contract status
  useEffect(() => {
    console.log("Contract status:", { 
      contract: !!contract, 
      contractLoading, 
      contractError: contractError?.message,
      address,
      contractAddress: CONTRACT_ADDRESS
    });
  }, [contract, contractLoading, contractError, address]);

  // Enhanced error handler
  const handleContractError = (error, operation) => {
    const errorMap = {
      4001: "Transaction rejected by user",
      4100: "Unauthorized - Please connect your wallet",
      4200: "Unsupported method",
      "-32603": "Internal JSON-RPC error - Network issue",
      "-32000": "Insufficient funds for gas",
      "-32002": "Resource unavailable",
    };

    const message = errorMap[error.code] || error.message || `${operation} failed`;
    console.error(`${operation} error:`, { 
      code: error.code, 
      message: error.message,
      data: error.data 
    });
    
    throw new Error(message);
  };

  // Network switching functionality
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
      });
      setNetworkError(null);
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }]
          });
          setNetworkError(null);
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw new Error('Failed to add Sepolia network');
        }
      } else {
        console.error('Failed to switch to Sepolia:', switchError);
        throw new Error('Failed to switch to Sepolia network');
      }
    }
  };
  
  // Enhanced wallet connection
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log("Attempting to connect wallet...");
      
      const metamask = metamaskWallet();
      const result = await connect(metamask);
      
      console.log("Wallet connection successful:", result);
      setNetworkError(null);
      return result;
    } catch (error) {
      console.error("Wallet connection failed:", error);
      handleContractError(error, "Wallet connection");
    } finally {
      setIsConnecting(false);
    }
  };

  // Gas estimation
  const estimateGasCost = async (formData) => {
    try {
      if (!contract || !address) {
        throw new Error("Contract or wallet not ready");
      }

      const campaignArgs = [
        address,
        formData.title,
        formData.description,
        formData.target,
        new Date(formData.deadline).getTime(),
        formData.image,
      ];
      
      // This is a rough estimation - actual implementation may vary
      const gasEstimate = await contract.estimator.createCampaign(campaignArgs);
      const gasPrice = await contract.provider.getGasPrice();
      const totalCost = gasEstimate.mul(gasPrice);
      
      return ethers.utils.formatEther(totalCost);
    } catch (error) {
      console.error("Gas estimation failed:", error);
      return "Unable to estimate";
    }
  };

  // Enhanced campaign creation
  const createCampaign = async (form) => {
    try {
      console.log("createCampaign called with:", form);
      console.log("Current address:", address);
      console.log("Contract status:", { 
        contract: !!contract, 
        contractLoading, 
        contractError: contractError?.message 
      });
      
      // Pre-flight checks
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      if (contractLoading) {
        throw new Error("Contract is still loading. Please wait a moment and try again.");
      }

      if (contractError) {
        throw new Error(`Contract error: ${contractError.message}`);
      }

      if (!contract) {
        throw new Error("Contract not initialized. Please check your network and contract address.");
      }

      // Validate the form data
      if (!form.title?.trim() || !form.description?.trim() || !form.target) {
        throw new Error("Missing required form fields");
      }

      // Check if target is valid
      if (ethers.BigNumber.from(form.target).lte(0)) {
        throw new Error("Campaign target must be greater than 0");
      }

      // Check deadline
      const deadlineTimestamp = new Date(form.deadline).getTime();
      if (deadlineTimestamp <= Date.now()) {
        throw new Error("Campaign deadline must be in the future");
      }

      const campaignArgs = [
        address, // owner
        form.title, // title
        form.description, // description
        form.target, // target (should already be in Wei)
        deadlineTimestamp, // deadline
        form.image || '', // image (handle empty image)
      ];

      console.log("Campaign arguments:", campaignArgs);
      console.log("Deadline timestamp:", deadlineTimestamp);
      console.log("Current timestamp:", Date.now());

      const data = await createCampaignContract({
        args: campaignArgs,
      });
      
      console.log("Contract call success", data);
      return data;
    } catch (error) {
      console.error("Contract call failure:", error);
      handleContractError(error, "Campaign creation");
    }
  };

  // NEW: Delete campaign function
  const deleteCampaign = async (campaignId) => {
    try {
      console.log("deleteCampaign called with ID:", campaignId);
      console.log("Current address:", address);
      
      // Pre-flight checks
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }

      if (contractLoading) {
        throw new Error("Contract is still loading. Please wait a moment and try again.");
      }

      if (contractError) {
        throw new Error(`Contract error: ${contractError.message}`);
      }

      if (!contract) {
        throw new Error("Contract not initialized. Please check your network and contract address.");
      }

      if (campaignId === undefined || campaignId === null || campaignId < 0) {
        throw new Error("Invalid campaign ID");
      }

      console.log("Calling deleteCampaign contract function with ID:", campaignId);

      const data = await deleteCampaignContract({
        args: [campaignId],
      });
      
      console.log("Campaign deletion successful:", data);
      return data;
    } catch (error) {
      console.error("Campaign deletion failed:", error);
      handleContractError(error, "Campaign deletion");
    }
  };

  // Enhanced campaign retrieval
  const getCampaigns = async () => {
    try {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const campaigns = await contract.call('getCampaigns');
      const parsedCampaigns = campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        isActive: campaign.isActive,
        pId: i
      }));
      
      return parsedCampaigns;
    } catch (error) {
      console.error("Failed to get campaigns:", error);
      handleContractError(error, "Get campaigns");
    }
  };

  const getUserCampaigns = async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const allCampaigns = await getCampaigns();
      const filteredCampaigns = allCampaigns.filter((campaign) => 
        campaign.owner.toLowerCase() === address.toLowerCase()
      );
      return filteredCampaigns;
    } catch (error) {
      console.error("Failed to get user campaigns:", error);
      handleContractError(error, "Get user campaigns");
    }
  };

  // NEW: Get specific campaign by ID
  const getCampaign = async (campaignId) => {
    try {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      if (campaignId === undefined || campaignId === null || campaignId < 0) {
        throw new Error("Invalid campaign ID");
      }

      const campaign = await contract.call('getCampaign', [campaignId]);
      const parsedCampaign = {
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        isActive: campaign.isActive,
        pId: campaignId
      };
      
      return parsedCampaign;
    } catch (error) {
      console.error("Failed to get campaign:", error);
      handleContractError(error, "Get campaign");
    }
  };

  const donate = async (pId, amount) => {
    try {
      if (!contract || !address) {
        throw new Error("Contract or wallet not ready");
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Donation amount must be greater than 0");
      }

      const data = await contract.call('donateToCampaign', [pId], { 
        value: ethers.utils.parseEther(amount.toString())
      });
      
      return data;
    } catch (error) {
      console.error("Donation fail:", error);
      handleContractError(error, "Donation");
    }
  };

  const getDonations = async (pId) => {
    try {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const donations = await contract.call('getDonators', [pId]);
      const numberOfDonations = donations[0].length;
      const parsedDonations = [];
      
      for(let i = 0; i < numberOfDonations; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString())
        });
      }
      
      return parsedDonations;
    } catch (error) {
      console.error("Failed to get donations:", error);
      handleContractError(error, "Get donations");
    }
  };

  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        contractLoading,
        contractError,
        networkError,
        isConnecting,
        connectWallet,
        switchToSepolia,
        createCampaign,
        deleteCampaign,
        getCampaigns,
        getCampaign,
        getUserCampaigns,
        donate,
        getDonations,
        estimateGasCost
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a StateContextProvider');
  }
  return context;
};
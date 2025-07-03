import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { DisplayCampaigns } from '../components';
import { useStateContext } from '../context';

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaised: 0,
    totalDonations: 0
  });
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { address, contract, getUserCampaigns } = useStateContext();
  const navigate = useNavigate();

  // Calculate user statistics
  const calculateStats = useCallback((campaignsData) => {
    if (!campaignsData || campaignsData.length === 0) {
      setStats({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRaised: 0,
        totalDonations: 0
      });
      return;
    }

    const now = new Date().getTime();
    const activeCampaigns = campaignsData.filter(campaign => 
      new Date(campaign.deadline).getTime() > now
    );
    
    const totalRaised = campaignsData.reduce((sum, campaign) => 
      sum + parseFloat(campaign.amountCollected || 0), 0
    );
    
    const totalDonations = campaignsData.reduce((sum, campaign) => 
      sum + parseInt(campaign.donators?.length || 0), 0
    );

    setStats({
      totalCampaigns: campaignsData.length,
      activeCampaigns: activeCampaigns.length,
      totalRaised: totalRaised,
      totalDonations: totalDonations
    });
  }, []);

  const fetchCampaigns = useCallback(async () => {
    if (!contract || !address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserCampaigns();
      setCampaigns(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
      calculateStats([]);
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, getUserCampaigns, calculateStats]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchCampaigns();
  };

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns, refreshKey]);

  // Show connection prompt if not connected
  if (!address) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#2c2f32] to-[#1c1c24] flex items-center justify-center">
            <svg className="w-12 h-12 text-[#4b5264]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-[#808191] mb-6">
            Please connect your wallet to view your profile and campaigns.
          </p>
          <button
            onClick={() => navigate('/')}
            className="
              px-6 py-3 bg-gradient-to-r from-[#8c6dfd] to-[#6b4ce6]
              text-white font-semibold rounded-[20px]
              transition-all duration-300 hover:scale-105
              shadow-lg hover:shadow-[#8c6dfd]/25
            "
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#1c1c24] to-[#1e1e26] rounded-[20px] p-6 shadow-xl border border-[#2c2f32]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="
              w-16 h-16 rounded-full bg-gradient-to-br from-[#4acd8d] to-[#3db579]
              flex items-center justify-center shadow-lg
            ">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
              <p className="text-[#808191] font-mono text-sm">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="
                px-4 py-2 bg-[#2c2f32] text-white rounded-[12px]
                transition-all duration-300 hover:bg-[#3a3a43]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={() => navigate('/create-campaign')}
              className="
                px-4 py-2 bg-gradient-to-r from-[#4acd8d] to-[#3db579]
                text-white rounded-[12px] font-semibold
                transition-all duration-300 hover:scale-105
                shadow-lg hover:shadow-[#4acd8d]/25
                flex items-center gap-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="
          bg-gradient-to-br from-[#1c1c24] to-[#1e1e26] 
          rounded-[20px] p-6 shadow-xl border border-[#2c2f32]
          hover:scale-105 transition-all duration-300
        ">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#4acd8d]/20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#4acd8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats.totalCampaigns}</h3>
          <p className="text-[#808191] text-sm">Total Campaigns</p>
        </div>

        <div className="
          bg-gradient-to-br from-[#1c1c24] to-[#1e1e26] 
          rounded-[20px] p-6 shadow-xl border border-[#2c2f32]
          hover:scale-105 transition-all duration-300
        ">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#8c6dfd]/20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#8c6dfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats.activeCampaigns}</h3>
          <p className="text-[#808191] text-sm">Active Campaigns</p>
        </div>

        <div className="
          bg-gradient-to-br from-[#1c1c24] to-[#1e1e26] 
          rounded-[20px] p-6 shadow-xl border border-[#2c2f32]
          hover:scale-105 transition-all duration-300
        ">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#f59e0b]/20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats.totalRaised.toFixed(4)} ETH</h3>
          <p className="text-[#808191] text-sm">Total Raised</p>
        </div>

        <div className="
          bg-gradient-to-br from-[#1c1c24] to-[#1e1e26] 
          rounded-[20px] p-6 shadow-xl border border-[#2c2f32]
          hover:scale-105 transition-all duration-300
        ">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#ef4444]/20 rounded-[12px] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{stats.totalDonations}</h3>
          <p className="text-[#808191] text-sm">Total Donations</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="
          bg-gradient-to-r from-[#ef4444]/10 to-[#dc2626]/10
          border border-[#ef4444]/20 rounded-[20px] p-6
          flex items-center gap-4
        ">
          <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[#ef4444] font-semibold mb-1">Error Loading Campaigns</h3>
            <p className="text-[#808191] text-sm">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="
              px-4 py-2 bg-[#ef4444]/20 text-[#ef4444] rounded-[12px]
              transition-all duration-300 hover:bg-[#ef4444]/30
              border border-[#ef4444]/30
            "
          >
            Retry
          </button>
        </div>
      )}

      {/* Campaigns Display */}
      <DisplayCampaigns 
        title="My Campaigns"
        isLoading={isLoading}
        campaigns={campaigns}
      />
    </div>
  );
};

export default Profile;
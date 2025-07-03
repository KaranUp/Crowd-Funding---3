import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DisplayCampaigns } from '../components';
import { useStateContext } from '../context';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { address, contract, getCampaigns } = useStateContext();
  const navigate = useNavigate();

  // Filter and sort options
  const categories = [
    { value: 'all', label: 'All Categories', icon: '🌟' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'environment', label: 'Environment', icon: '🌱' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'community', label: 'Community', icon: '🤝' },
    { value: 'emergency', label: 'Emergency', icon: '⚡' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'target_high', label: 'Highest Target' },
    { value: 'target_low', label: 'Lowest Target' },
    { value: 'progress', label: 'Most Progress' },
    { value: 'deadline', label: 'Ending Soon' }
  ];

  // Calculate global statistics
  const globalStats = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalRaised: 0,
        totalBackers: 0
      };
    }

    const now = new Date().getTime();
    const activeCampaigns = campaigns.filter(campaign => 
      new Date(campaign.deadline).getTime() > now
    );
    
    const totalRaised = campaigns.reduce((sum, campaign) => 
      sum + parseFloat(campaign.amountCollected || 0), 0
    );
    
    const totalBackers = campaigns.reduce((sum, campaign) => 
      sum + parseInt(campaign.donators?.length || 0), 0
    );

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalRaised,
      totalBackers
    };
  }, [campaigns]);

  // Filter and sort campaigns
  useEffect(() => {
    if (!campaigns) return;

    let filtered = [...campaigns];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(campaign =>
        campaign.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'target_high':
          return parseFloat(b.target || 0) - parseFloat(a.target || 0);
        case 'target_low':
          return parseFloat(a.target || 0) - parseFloat(b.target || 0);
        case 'progress':
          const progressA = (parseFloat(a.amountCollected || 0) / parseFloat(a.target || 1)) * 100;
          const progressB = (parseFloat(b.amountCollected || 0) / parseFloat(b.target || 1)) * 100;
          return progressB - progressA;
        case 'deadline':
          const nowTime = new Date().getTime();
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          // Filter out expired campaigns first, then sort by closest deadline
          const isExpiredA = deadlineA < nowTime;
          const isExpiredB = deadlineB < nowTime;
          if (isExpiredA && !isExpiredB) return 1;
          if (!isExpiredA && isExpiredB) return -1;
          return deadlineA - deadlineB;
        case 'newest':
        default:
          return new Date(b.deadline) - new Date(a.deadline);
      }
    });

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, selectedCategory, sortBy]);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getCampaigns();
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [getCampaigns]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchCampaigns();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  useEffect(() => {
    if (contract) fetchCampaigns();
  }, [contract, fetchCampaigns, refreshKey]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1c1c24] via-[#1e1e26] to-[#1c1c24] rounded-[20px] p-8 shadow-xl border border-[#2c2f32] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Discover Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4acd8d] to-[#3db579]">Campaigns</span>
              </h1>
              <p className="text-[#808191] text-lg mb-6 max-w-2xl">
                Support innovative projects and make a difference in the world. Browse through active campaigns and help bring ideas to life.
              </p>
              {!address && (
                <button
                  onClick={() => navigate('/create-campaign')}
                  className="
                    px-6 py-3 bg-gradient-to-r from-[#4acd8d] to-[#3db579]
                    text-white font-semibold rounded-[20px]
                    transition-all duration-300 hover:scale-105
                    shadow-lg hover:shadow-[#4acd8d]/25
                    flex items-center gap-2
                  "
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Start Your Campaign
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <div className="text-center p-4 bg-[#2c2f32]/50 rounded-[16px] backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-[#4acd8d] mb-1">{globalStats.totalCampaigns}</h3>
                <p className="text-[#808191] text-sm">Total Campaigns</p>
              </div>
              <div className="text-center p-4 bg-[#2c2f32]/50 rounded-[16px] backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-[#8c6dfd] mb-1">{globalStats.activeCampaigns}</h3>
                <p className="text-[#808191] text-sm">Active Now</p>
              </div>
              <div className="text-center p-4 bg-[#2c2f32]/50 rounded-[16px] backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-[#f59e0b] mb-1">{globalStats.totalRaised.toFixed(2)}</h3>
                <p className="text-[#808191] text-sm">ETH Raised</p>
              </div>
              <div className="text-center p-4 bg-[#2c2f32]/50 rounded-[16px] backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-[#ef4444] mb-1">{globalStats.totalBackers}</h3>
                <p className="text-[#808191] text-sm">Backers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#4acd8d]/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#8c6dfd]/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-r from-[#1c1c24] to-[#1e1e26] rounded-[20px] p-6 shadow-xl border border-[#2c2f32]">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns by title, description, or category..."
                className="
                  w-full px-4 py-3 pl-12 bg-[#2c2f32] text-white rounded-[16px]
                  border border-[#3a3a43] focus:border-[#4acd8d] focus:outline-none
                  transition-all duration-300
                "
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808191]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="
                w-full px-4 py-3 bg-[#2c2f32] text-white rounded-[16px]
                border border-[#3a3a43] focus:border-[#4acd8d] focus:outline-none
                transition-all duration-300
              "
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="
                w-full px-4 py-3 bg-[#2c2f32] text-white rounded-[16px]
                border border-[#3a3a43] focus:border-[#4acd8d] focus:outline-none
                transition-all duration-300
              "
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className="
                px-4 py-3 bg-[#2c2f32] text-[#808191] rounded-[16px]
                transition-all duration-300 hover:bg-[#3a3a43] hover:text-white
                border border-[#3a3a43]
              "
            >
              Clear
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="
                px-4 py-3 bg-[#4acd8d] text-white rounded-[16px]
                transition-all duration-300 hover:bg-[#3db579]
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
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedCategory !== 'all' || sortBy !== 'newest') && (
          <div className="mt-4 pt-4 border-t border-[#3a3a43]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#808191] text-sm">Active filters:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-[#4acd8d]/20 text-[#4acd8d] rounded-full text-sm">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-3 py-1 bg-[#8c6dfd]/20 text-[#8c6dfd] rounded-full text-sm">
                  Category: {categories.find(c => c.value === selectedCategory)?.label}
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="px-3 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded-full text-sm">
                  Sort: {sortOptions.find(s => s.value === sortBy)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-[#808191]">
          {filteredCampaigns.length > 0 ? (
            <span>
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
              {searchTerm && ` for "${searchTerm}"`}
            </span>
          ) : campaigns.length > 0 ? (
            <span>No campaigns match your current filters</span>
          ) : (
            <span>No campaigns available</span>
          )}
        </div>
        
        {campaigns.length > 0 && (
          <div className="text-sm text-[#808191]">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[16px] p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCampaigns.length === 0 && campaigns.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="mb-6">
            <svg className="w-24 h-24 text-[#4a5568] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Campaigns Yet</h3>
          <p className="text-[#808191] mb-6 max-w-md mx-auto">
            Be the first to create a campaign and start making a difference in the world.
          </p>
          <button
            onClick={() => navigate('/create-campaign')}
            className="
              px-6 py-3 bg-gradient-to-r from-[#4acd8d] to-[#3db579]
              text-white font-semibold rounded-[20px]
              transition-all duration-300 hover:scale-105
              shadow-lg hover:shadow-[#4acd8d]/25
            "
          >
            Create First Campaign
          </button>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && filteredCampaigns.length === 0 && campaigns.length > 0 && !error && (
        <div className="text-center py-16">
          <div className="mb-6">
            <svg className="w-24 h-24 text-[#4a5568] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
          <p className="text-[#808191] mb-6 max-w-md mx-auto">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <button
            onClick={clearFilters}
            className="
              px-6 py-3 bg-[#2c2f32] text-white rounded-[20px]
              transition-all duration-300 hover:bg-[#3a3a43]
              border border-[#3a3a43]
            "
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Display Campaigns */}
      <DisplayCampaigns 
        title=""
        isLoading={isLoading}
        campaigns={filteredCampaigns}
      />
    </div>
  );
};

export default Home;
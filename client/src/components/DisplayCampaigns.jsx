import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";
import FundCard from './FundCard';
import { loader } from '../assets';

const DisplayCampaigns = ({ title, isLoading, campaigns }) => {
  const navigate = useNavigate();

  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.pId}`, { state: campaign })
  }

  return (
    <div className="w-full">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="font-epilogue font-bold text-2xl text-white">
            {title}
          </h1>
          <div className="bg-gradient-to-r from-[#1dc071] to-[#16a461] px-3 py-1 rounded-full">
            <span className="font-epilogue font-semibold text-sm text-white">
              {campaigns.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <img 
                src={loader} 
                alt="Loading campaigns..." 
                className="w-16 h-16 object-contain animate-spin" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1dc071] to-[#16a461] opacity-20 rounded-full animate-pulse"></div>
            </div>
            <p className="font-epilogue font-medium text-[#818183] mt-4 text-center">
              Loading campaigns...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-[#2c2f32] to-[#1c1c24] rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg 
                className="w-12 h-12 text-[#818183]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="font-epilogue font-semibold text-xl text-white mb-2 text-center">
              No Campaigns Yet
            </h3>
            <p className="font-epilogue font-medium text-[#818183] text-center max-w-md leading-relaxed">
              You haven't created any campaigns yet. Start your first campaign to begin fundraising for your cause.
            </p>
            <button 
              onClick={() => navigate('/create-campaign')}
              className="mt-6 bg-gradient-to-r from-[#1dc071] to-[#16a461] hover:from-[#16a461] hover:to-[#1dc071] text-white font-epilogue font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Create Your First Campaign
            </button>
          </div>
        )}

        {/* Campaigns Grid */}
        {!isLoading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {campaigns.map((campaign, index) => (
              <div
                key={campaign.id || uuidv4()}
                className="transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <FundCard 
                  {...campaign}
                  handleClick={() => handleNavigate(campaign)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Show More Button (if needed) */}
        {!isLoading && campaigns.length > 8 && (
          <div className="flex justify-center mt-12">
            <button className="bg-[#2c2f32] hover:bg-[#3a3d42] text-white font-epilogue font-semibold px-8 py-3 rounded-lg transition-all duration-300 border border-[#3a3d42] hover:border-[#1dc071] hover:shadow-lg">
              Load More Campaigns
            </button>
          </div>
        )}
      </div>

      {/* Optional: Campaign Stats Bar */}
      {!isLoading && campaigns.length > 0 && (
        <div className="mt-12 p-6 bg-gradient-to-r from-[#2c2f32] to-[#1c1c24] rounded-xl border border-[#3a3d42]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-epilogue font-bold text-2xl text-white">
                {campaigns.length}
              </p>
              <p className="font-epilogue font-medium text-[#818183] text-sm mt-1">
                Total Campaigns
              </p>
            </div>
            <div>
              <p className="font-epilogue font-bold text-2xl text-[#1dc071]">
                {campaigns.filter(c => c.amountCollected > 0).length}
              </p>
              <p className="font-epilogue font-medium text-[#818183] text-sm mt-1">
                Active Campaigns
              </p>
            </div>
            <div>
              <p className="font-epilogue font-bold text-2xl text-[#1dc071]">
                ${campaigns.reduce((sum, c) => sum + Number(c.amountCollected || 0), 0).toLocaleString()}
              </p>
              <p className="font-epilogue font-medium text-[#818183] text-sm mt-1">
                Total Raised
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DisplayCampaigns;
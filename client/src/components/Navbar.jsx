import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { useStateContext } from "../context";
import { CustomButton } from "./";
import { logo, menu, search, thirdweb } from "../assets";
import { navlinks } from "../constants";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState("dashboard");
  const [toggleDrawer, setToggleDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const { connectWallet, address, campaigns } = useStateContext();
  const searchInputRef = useRef(null);
  const drawerRef = useRef(null);

  // Sync active state with current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeLink = navlinks.find(link => link.link === currentPath);
    if (activeLink) {
      setIsActive(activeLink.name);
    }
  }, [location.pathname]);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setToggleDrawer(false);
      }
    };

    if (toggleDrawer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toggleDrawer]);

  // Enhanced search functionality
  useEffect(() => {
    if (searchQuery.trim() && campaigns) {
      const filtered = campaigns.filter(campaign => 
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.owner.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, campaigns]);

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to campaigns page with search query
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setIsSearchFocused(false);
    }
  };

  // Handle campaign selection from search results
  const handleCampaignSelect = (campaignId) => {
    navigate(`/campaign-details/${campaignId}`);
    setSearchQuery("");
    setShowResults(false);
    setIsSearchFocused(false);
  };

  // Handle navigation with better UX
  const handleNavigation = (link) => {
    if (!link.disabled) {
      setIsActive(link.name);
      setToggleDrawer(false);
      navigate(link.link);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to close drawer and search results
      if (e.key === 'Escape') {
        if (toggleDrawer) {
          setToggleDrawer(false);
        }
        if (showResults) {
          setShowResults(false);
          setIsSearchFocused(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDrawer, showResults]);

  return (
    <header className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6 relative">
      {/* Animated CrowdFunding Logo */}
      <div className="flex items-center gap-4">
        <Link to="/" className="group flex items-center gap-3 transition-all duration-300 hover:scale-105">
          <div className="
            w-[52px] h-[52px] rounded-[12px] 
            bg-gradient-to-br from-[#4acd8d] to-[#1dc071]
            flex justify-center items-center cursor-pointer
            shadow-lg group-hover:shadow-xl group-hover:shadow-[#4acd8d]/25
            transition-all duration-300 relative overflow-hidden
          ">
            <img
              src={logo}
              alt="Logo"
              className="w-[60%] h-[60%] object-contain transition-transform duration-300 group-hover:rotate-12"
            />
            
            {/* Animated background effect */}
            <div className="
              absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full transition-transform duration-700
            "></div>
          </div>
          
          <div className="hidden md:block">
            <h1 className="
              text-2xl font-bold bg-gradient-to-r from-[#4acd8d] via-[#1dc071] to-[#4acd8d] 
              bg-clip-text text-transparent font-epilogue
              group-hover:bg-gradient-to-r group-hover:from-[#1dc071] group-hover:via-[#4acd8d] group-hover:to-[#1dc071]
              transition-all duration-500 animate-pulse
            ">
              CrowdFunding
            </h1>
            <div className="h-0.5 bg-gradient-to-r from-[#4acd8d] to-[#1dc071] rounded-full 
                          scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        </Link>
      </div>

      {/* Compact Search Bar */}
      <div className="flex-1 flex justify-center max-w-[400px] relative group">
        <form 
          onSubmit={handleSearch}
          className={`
            flex flex-row w-full py-2 pl-4 pr-2 h-[48px] 
            bg-gradient-to-r from-[#1c1c24] to-[#1e1e26]
            rounded-[24px] transition-all duration-300
            border-2 ${isSearchFocused ? 'border-[#4acd8d]/50' : 'border-transparent'}
            shadow-lg hover:shadow-xl
            ${isSearchFocused ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
          `}
        >
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={(e) => {
              // Delay hiding results to allow clicking on them
              setTimeout(() => {
                if (!e.currentTarget.contains(document.activeElement)) {
                  setIsSearchFocused(false);
                  setShowResults(false);
                }
              }, 200);
            }}
            placeholder="Search campaigns... (Ctrl+K)"
            className="
              flex w-full font-epilogue font-normal text-[14px] 
              placeholder:text-[#4b5264] text-white bg-transparent 
              outline-none transition-all duration-300
            "
          />

          <button
            type="submit"
            className="
              w-[40px] h-[32px] rounded-[16px] 
              bg-gradient-to-r from-[#4acd8d] to-[#3db579]
              flex justify-center items-center cursor-pointer
              transition-all duration-300 hover:scale-105
              shadow-lg hover:shadow-[#4acd8d]/25
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            disabled={!searchQuery.trim()}
          >
            <img
              src={search}
              alt="search"
              className="w-[14px] h-[14px] object-contain"
            />
          </button>
        </form>

        {/* Enhanced Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="
            absolute top-full mt-2 w-full bg-[#1c1c24] 
            rounded-[20px] shadow-2xl border border-[#2c2f32]
            z-50 max-h-[300px] overflow-y-auto
            animate-fadeIn
          ">
            <div className="p-2">
              <div className="text-[#4b5264] text-xs px-3 py-2 border-b border-[#2c2f32]">
                Found {searchResults.length} campaign{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.slice(0, 5).map((campaign, index) => (
                <div
                  key={campaign.pId || index}
                  onClick={() => handleCampaignSelect(campaign.pId)}
                  className="
                    flex items-center gap-3 p-3 hover:bg-[#2c2f32] 
                    cursor-pointer transition-all duration-200 rounded-[12px] m-1
                    group/item
                  "
                >
                  <div className="
                    w-12 h-12 rounded-[8px] bg-gradient-to-br from-[#2c2f32] to-[#1c1c24]
                    flex items-center justify-center overflow-hidden
                  ">
                    {campaign.image ? (
                      <img 
                        src={campaign.image} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[#4acd8d] text-xs">📋</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="
                      text-white text-sm font-medium truncate
                      group-hover/item:text-[#4acd8d] transition-colors
                    ">
                      {campaign.title}
                    </p>
                    <p className="text-[#4b5264] text-xs truncate">
                      by {campaign.owner?.slice(0, 6)}...{campaign.owner?.slice(-4)}
                    </p>
                    <p className="text-[#4acd8d] text-xs">
                      {campaign.target} ETH target
                    </p>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div 
                  onClick={() => handleSearch({ preventDefault: () => {} })}
                  className="
                    text-center py-2 text-[#4acd8d] text-sm cursor-pointer
                    hover:bg-[#2c2f32] transition-colors rounded-[12px] m-1
                  "
                >
                  View all {searchResults.length} results →
                </div>
              )}
            </div>
          </div>
        )}

        {/* No results message */}
        {showResults && searchQuery && searchResults.length === 0 && (
          <div className="
            absolute top-full mt-2 w-full bg-[#1c1c24] 
            rounded-[20px] shadow-2xl border border-[#2c2f32]
            z-50 p-4 text-center
          ">
            <div className="text-[#4b5264] text-sm">
              No campaigns found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="sm:flex hidden flex-row justify-end gap-4 items-center">
        <CustomButton 
          btnType="button"
          title={address ? 'Create a campaign' : 'Connect Wallet'}
          styles={`
            ${address ? 'bg-gradient-to-r from-[#1dc071] to-[#16a085]' : 'bg-gradient-to-r from-[#8c6dfd] to-[#6b4ce6]'}
            transition-all duration-300 hover:scale-105 shadow-lg
            ${address ? 'hover:shadow-[#1dc071]/25' : 'hover:shadow-[#8c6dfd]/25'}
          `}
          handleClick={() => {
            if(address) navigate('create-campaign')
            else connectWallet()
          }}
        />

        <Link 
          to="/profile" 
          className="group transition-all duration-300 hover:scale-105"
          aria-label="Go to profile"
        >
          <div className="
            w-[52px] h-[52px] rounded-full 
            bg-gradient-to-br from-[#2c2f32] to-[#1c1c24]
            flex justify-center items-center cursor-pointer
            transition-all duration-300 shadow-lg
            hover:shadow-xl border-2 border-transparent
            hover:border-[#4acd8d]/30
            relative overflow-hidden
          ">
            <img
              src={thirdweb}
              alt="Profile"
              className="w-[60%] h-[60%] object-contain transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Online indicator */}
            {address && (
              <div className="
                absolute bottom-1 right-1 w-3 h-3 
                bg-[#4acd8d] rounded-full border-2 border-[#1c1c24]
                animate-pulse
              "></div>
            )}
          </div>
        </Link>

        {/* Wallet address display */}
        {address && (
          <div className="
            hidden lg:flex items-center px-3 py-2 
            bg-[#1c1c24] rounded-[20px] border border-[#2c2f32]
          ">
            <div className="w-2 h-2 bg-[#4acd8d] rounded-full mr-2 animate-pulse"></div>
            <span className="text-[#4b5264] text-sm font-mono">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Mobile Navigation */}
      <div className="sm:hidden flex justify-between items-center relative" ref={drawerRef}>
        {/* Mobile Logo */}
        <Link to="/" className="transition-transform duration-300 hover:scale-105">
          <div className="
            w-[40px] h-[40px] rounded-[10px] 
            bg-gradient-to-br from-[#4acd8d] to-[#1dc071]
            flex justify-center items-center cursor-pointer
            shadow-lg border border-[#3a3a43]
          ">
            <img
              src={logo}
              alt="Logo"
              className="w-[60%] h-[60%] object-contain"
            />
          </div>
        </Link>

        {/* Mobile Title */}
        <div className="flex-1 text-center mx-4">
          <h1 className="
            text-lg font-bold bg-gradient-to-r from-[#4acd8d] to-[#1dc071] 
            bg-clip-text text-transparent font-epilogue
          ">
            CrowdFunding
          </h1>
        </div>

        <button
          onClick={() => setToggleDrawer((prev) => !prev)}
          className="
            p-2 rounded-[10px] transition-all duration-300
            hover:bg-[#2c2f32]/50 active:scale-95
          "
          aria-label="Toggle navigation menu"
          aria-expanded={toggleDrawer}
        >
          <img
            src={menu}
            alt="Menu"
            className={`
              w-[34px] h-[34px] object-contain cursor-pointer
              transition-transform duration-300
              ${toggleDrawer ? 'rotate-90' : 'rotate-0'}
            `}
          />
        </button>

        {/* Enhanced Mobile Drawer */}
        <div
          className={`
            absolute top-[60px] right-0 left-0 
            bg-gradient-to-b from-[#1c1c24] to-[#181820]
            z-50 shadow-2xl py-6 rounded-[20px]
            border border-[#2c2f32] backdrop-blur-sm
            transition-all duration-500 ease-in-out
            ${toggleDrawer ? 'translate-y-0 opacity-100' : '-translate-y-[120%] opacity-0'}
          `}
        >
          {/* Mobile Search */}
          <div className="px-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="
                  flex-1 px-3 py-2 bg-[#2c2f32] rounded-[12px] 
                  text-white text-sm border border-[#3a3a43]
                  focus:border-[#4acd8d]/50 outline-none
                "
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="
                  px-4 py-2 bg-gradient-to-r from-[#4acd8d] to-[#3db579]
                  rounded-[12px] text-white text-sm font-medium
                  disabled:opacity-50 transition-all duration-300
                "
              >
                Search
              </button>
            </form>
          </div>

          {/* Mobile Navigation Links */}
          <ul className="mb-6 px-2">
            {navlinks.map((link, index) => (
              <li
                key={link.name}
                className={`
                  flex p-4 cursor-pointer rounded-[12px] mx-2 mb-2
                  transition-all duration-300 hover:scale-[1.02]
                  ${isActive === link.name 
                    ? 'bg-gradient-to-r from-[#3a3a43] to-[#2c2f32] shadow-lg' 
                    : 'hover:bg-[#2c2f32]/50'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleNavigation(link)}
              >
                <img
                  src={link.imgUrl}
                  alt={link.name}
                  className={`
                    w-[24px] h-[24px] object-contain transition-all duration-300
                    ${isActive === link.name ? "grayscale-0" : "grayscale hover:grayscale-0"}
                  `}
                />
                <p
                  className={`
                    ml-[20px] font-epilogue font-semibold text-[14px] 
                    transition-colors duration-300
                    ${isActive === link.name ? "text-[#4acd8d]" : "text-[#808191] hover:text-white"}
                  `}
                >
                  {link.name.charAt(0).toUpperCase() + link.name.slice(1)}
                </p>
              </li>
            ))}
          </ul>

          {/* Mobile Action Button */}
          <div className="flex mx-6">
            <CustomButton
              btnType="button"
              title={address ? "Create a campaign" : "Connect"}
              styles={`
                w-full
                ${address 
                  ? 'bg-gradient-to-r from-[#1dc071] to-[#16a085]' 
                  : 'bg-gradient-to-r from-[#8c6dfd] to-[#6b4ce6]'
                }
                transition-all duration-300 hover:scale-105 shadow-lg
              `}
              handleClick={() => {
                if (address) navigate("create-campaign");
                else connectWallet();
                setToggleDrawer(false);
              }}
            />
          </div>

          {/* Mobile wallet info */}
          {address && (
            <div className="
              flex items-center justify-center mt-4 px-4 py-2 mx-6
              bg-[#2c2f32]/50 rounded-[12px] border border-[#3a3a43]
            ">
              <div className="w-2 h-2 bg-[#4acd8d] rounded-full mr-2 animate-pulse"></div>
              <span className="text-[#4b5264] text-sm font-mono">
                {`${address.slice(0, 8)}...${address.slice(-6)}`}
              </span>
            </div>
          )}
        </div>

        {/* Backdrop overlay */}
        {toggleDrawer && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 -top-[60px]"
            onClick={() => setToggleDrawer(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { logo, sun } from '../assets';
import { navlinks } from '../constants';

// Enhanced Icon component with improved accessibility and visual feedback
const Icon = ({ 
  styles, 
  name, 
  imgUrl, 
  isActive, 
  disabled, 
  handleClick, 
  tooltip,
  showTooltip = false 
}) => (
  <div 
    className={`
      group relative w-[48px] h-[48px] rounded-[12px] 
      ${isActive && isActive === name ? 'bg-[#2c2f32] shadow-lg scale-105' : 'bg-transparent hover:bg-[#2c2f32]/50'} 
      flex justify-center items-center 
      ${!disabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} 
      transition-all duration-300 ease-in-out
      hover:scale-110 hover:shadow-md
      ${styles}
    `} 
    onClick={handleClick}
    role="button"
    tabIndex={disabled ? -1 : 0}
    aria-label={tooltip || name}
    onKeyDown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && handleClick) {
        e.preventDefault();
        handleClick();
      }
    }}
  >
    <img 
      src={imgUrl} 
      alt={`${name} icon`} 
      className={`
        w-1/2 h-1/2 transition-all duration-300
        ${isActive !== name ? 'grayscale group-hover:grayscale-0' : ''} 
        ${disabled ? 'opacity-50' : ''}
      `} 
    />
    
    {/* Enhanced tooltip with better positioning and styling */}
    {showTooltip && tooltip && (
      <div className="
        absolute left-full ml-3 px-3 py-2 
        bg-[#2c2f32] text-white text-sm rounded-lg 
        opacity-0 group-hover:opacity-100 
        pointer-events-none transition-all duration-300
        whitespace-nowrap z-50
        shadow-lg border border-[#3a3a43]
        before:content-[''] before:absolute before:right-full 
        before:top-1/2 before:-translate-y-1/2
        before:border-4 before:border-transparent 
        before:border-r-[#2c2f32]
      ">
        {tooltip}
      </div>
    )}
  </div>
);

// Enhanced Sidebar component with improved UX and accessibility
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActive, setIsActive] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync active state with current route
  useEffect(() => {
    const currentPath = location.pathname;
    const activeLink = navlinks.find(link => link.link === currentPath);
    if (activeLink) {
      setIsActive(activeLink.name);
    }
  }, [location.pathname]);

  // Handle navigation with improved error handling
  const handleNavigation = (link) => {
    if (!link.disabled) {
      setIsActive(link.name);
      try {
        navigate(link.link);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  return (
    <aside className="flex justify-between items-center flex-col sticky top-5 h-[93vh] z-40">
      {/* Logo section with enhanced hover effect */}
      <Link 
        to="/" 
        className="group transition-transform duration-300 hover:scale-105"
        aria-label="Go to homepage"
      >
        <div className="
          w-[52px] h-[52px] bg-[#2c2f32] rounded-[12px] 
          flex justify-center items-center
          shadow-lg hover:shadow-xl transition-all duration-300
          border border-[#3a3a43] hover:border-[#4a4a53]
        ">
          <img 
            src={logo} 
            alt="Company logo" 
            className="w-1/2 h-1/2 transition-transform duration-300 group-hover:scale-110" 
          />
        </div>
      </Link>

      {/* Main navigation container with enhanced styling */}
      <nav className="
        flex-1 flex flex-col justify-between items-center 
        bg-gradient-to-b from-[#1c1c24] to-[#181820]
        rounded-[20px] w-[76px] py-6 mt-12
        shadow-xl border border-[#2a2a35]
        backdrop-blur-sm
      ">
        {/* Navigation links */}
        <div className="flex flex-col justify-center items-center gap-4">
          {navlinks.map((link, index) => (
            <div
              key={link.name}
              className="relative"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <Icon 
                {...link}
                isActive={isActive}
                showTooltip={true}
                tooltip={link.name.charAt(0).toUpperCase() + link.name.slice(1)}
                handleClick={() => handleNavigation(link)}
              />
              
              {/* Active indicator */}
              {isActive === link.name && (
                <div className="
                  absolute -left-1 top-1/2 -translate-y-1/2
                  w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500
                  rounded-full shadow-lg
                  animate-pulse
                "></div>
              )}
            </div>
          ))}
        </div>

        {/* Theme toggle button with enhanced functionality */}
        <div className="relative group">
          <Icon 
            styles="
              bg-gradient-to-br from-[#2c2f32] to-[#1c1c24] 
              shadow-lg hover:shadow-xl
              border border-[#3a3a43] hover:border-[#4a4a53]
            " 
            imgUrl={sun} 
            name="theme-toggle"
            tooltip="Toggle theme"
            showTooltip={true}
            handleClick={() => {
              // Add theme toggle functionality here
              console.log('Theme toggle clicked');
            }}
          />
        </div>
      </nav>

      {/* Subtle background glow effect */}
      <div className="
        absolute inset-0 -z-10
        bg-gradient-to-b from-transparent via-[#1c1c24]/20 to-transparent
        rounded-[25px] blur-xl
      "></div>
    </aside>
  );
};

export default Sidebar;
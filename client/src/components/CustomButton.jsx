import React, { useState } from 'react';

const CustomButton = ({ 
  btnType = 'button', 
  title, 
  handleClick, 
  styles = '',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-gradient-to-r from-[#1dc071] to-[#16a461] 
          hover:from-[#16a461] hover:to-[#1dc071] 
          text-white border-2 border-transparent
          shadow-lg shadow-[#1dc071]/25
          hover:shadow-xl hover:shadow-[#1dc071]/40
        `;
      case 'secondary':
        return `
          bg-transparent border-2 border-[#1dc071] 
          text-[#1dc071] hover:bg-[#1dc071] hover:text-white
          hover:shadow-lg hover:shadow-[#1dc071]/25
        `;
      case 'outline':
        return `
          bg-transparent border-2 border-[#3a3d42] 
          text-white hover:border-[#1dc071] hover:text-[#1dc071]
          hover:shadow-lg hover:shadow-[#1dc071]/10
        `;
      case 'ghost':
        return `
          bg-transparent border-2 border-transparent 
          text-[#808191] hover:text-[#1dc071] hover:bg-[#1dc071]/10
        `;
      case 'danger':
        return `
          bg-gradient-to-r from-red-500 to-red-600 
          hover:from-red-600 hover:to-red-700 
          text-white border-2 border-transparent
          shadow-lg shadow-red-500/25
          hover:shadow-xl hover:shadow-red-500/40
        `;
      default:
        return getVariantStyles.primary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'min-h-[40px] px-4 text-sm';
      case 'medium':
        return 'min-h-[52px] px-6 text-base';
      case 'large':
        return 'min-h-[60px] px-8 text-lg';
      default:
        return 'min-h-[52px] px-6 text-base';
    }
  };

  const getDisabledStyles = () => {
    if (disabled || loading) {
      return `
        opacity-50 cursor-not-allowed 
        hover:shadow-none hover:scale-100
        pointer-events-none
      `;
    }
    return '';
  };

  const baseStyles = `
    font-epilogue font-semibold leading-6 
    rounded-xl transition-all duration-300 ease-out
    transform hover:scale-[1.02] active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-[#1dc071]/30
    relative overflow-hidden
    ${fullWidth ? 'w-full' : ''}
    ${getSizeStyles()}
    ${getVariantStyles()}
    ${getDisabledStyles()}
  `;

  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-5 w-5" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner />
          <span>Loading...</span>
        </div>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="flex-shrink-0">{icon}</span>
          <span>{title}</span>
        </div>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <div className="flex items-center justify-center gap-2">
          <span>{title}</span>
          <span className="flex-shrink-0">{icon}</span>
        </div>
      );
    }

    return title;
  };

  return (
    <button
      type={btnType}
      disabled={disabled || loading}
      className={`${baseStyles} ${styles}`}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Ripple Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Button Content */}
      <span className="relative z-10">
        {renderContent()}
      </span>
      
      {/* Shine Effect */}
      {!disabled && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      )}
    </button>
  )
}

export default CustomButton
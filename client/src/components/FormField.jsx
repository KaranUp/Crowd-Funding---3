import React, { useState } from 'react'

const FormField = ({ 
  labelName, 
  placeholder, 
  inputType, 
  isTextArea, 
  value, 
  handleChange,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  icon
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const hasValue = value && value.toString().length > 0;
  const isError = error && error.length > 0;
  const isPassword = inputType === 'password';
  
  const getBorderColor = () => {
    if (isError) return 'border-red-500';
    if (isFocused) return 'border-[#1dc071]';
    if (hasValue) return 'border-[#4b5264]';
    return 'border-[#3a3a43]';
  };

  const getLabelColor = () => {
    if (isError) return 'text-red-400';
    if (isFocused || hasValue) return 'text-[#1dc071]';
    return 'text-[#808191]';
  };

  const getCharacterCount = () => {
    if (!maxLength) return null;
    const currentLength = value ? value.toString().length : 0;
    const isNearLimit = currentLength > maxLength * 0.8;
    
    return (
      <span className={`text-xs ${isNearLimit ? 'text-orange-400' : 'text-[#808191]'}`}>
        {currentLength}/{maxLength}
      </span>
    );
  };

  return (
    <div className="flex-1 w-full">
      <label className="flex flex-col">
        {/* Label with required indicator */}
        {labelName && (
          <div className="flex items-center justify-between mb-2">
            <span className={`font-epilogue font-medium text-sm leading-5 transition-colors duration-200 ${getLabelColor()}`}>
              {labelName}
              {required && <span className="text-red-400 ml-1">*</span>}
            </span>
            {maxLength && getCharacterCount()}
          </div>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div className={`transition-colors duration-200 ${
                isFocused ? 'text-[#1dc071]' : 'text-[#808191]'
              }`}>
                {icon}
              </div>
            </div>
          )}

          {/* Input/Textarea */}
          {isTextArea ? (
            <textarea 
              required={required}
              disabled={disabled}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={6}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`
                w-full py-4 px-4 ${icon ? 'pl-12' : ''} 
                outline-none border-2 transition-all duration-200
                bg-gradient-to-br from-[#1c1c24] to-[#2a2a35]
                font-epilogue text-white text-sm
                placeholder:text-[#4b5264] placeholder:transition-colors
                rounded-xl resize-none
                ${getBorderColor()}
                ${isFocused ? 'shadow-lg shadow-[#1dc071]/10' : ''}
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4b5264]'}
                focus:placeholder:text-[#6b7280]
                sm:min-w-[300px]
              `}
            />
          ) : (
            <input 
              required={required}
              disabled={disabled}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              type={isPassword && showPassword ? 'text' : inputType}
              step={inputType === 'number' ? "0.01" : undefined}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`
                w-full py-4 px-4 ${icon ? 'pl-12' : ''} ${isPassword ? 'pr-12' : ''}
                outline-none border-2 transition-all duration-200
                bg-gradient-to-br from-[#1c1c24] to-[#2a2a35]
                font-epilogue text-white text-sm
                placeholder:text-[#4b5264] placeholder:transition-colors
                rounded-xl
                ${getBorderColor()}
                ${isFocused ? 'shadow-lg shadow-[#1dc071]/10' : ''}
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4b5264]'}
                focus:placeholder:text-[#6b7280]
                sm:min-w-[300px]
              `}
            />
          )}

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#808191] hover:text-[#1dc071] transition-colors duration-200"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}

          {/* Focus Ring Effect */}
          {isFocused && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1dc071]/5 to-[#16a461]/5 pointer-events-none"></div>
          )}
        </div>

        {/* Helper Text and Error */}
        <div className="mt-2 min-h-[20px]">
          {isError ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-epilogue text-sm text-red-400">{error}</span>
            </div>
          ) : helperText ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#808191] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-epilogue text-sm text-[#808191]">{helperText}</span>
            </div>
          ) : null}
        </div>
      </label>
    </div>
  )
}

export default FormField
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import { Sepolia } from "@thirdweb-dev/chains";
import { StateContextProvider } from './context';
import App from './App';
import './index.css';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#1c1c24] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1dc071]"></div>
      <p className="text-white text-lg">Loading DApp...</p>
    </div>
  </div>
);

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      // You can integrate with error tracking services like Sentry here
      console.log('Production error logged:', { error, errorInfo });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      
      return (
        <div className="min-h-screen bg-[#1c1c24] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2c2f32] to-[#3a3a43] p-8 rounded-[20px] text-white max-w-lg w-full shadow-xl border border-[#4a4a52]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
              <p className="text-[#808191] mb-4">
                The application encountered an unexpected error. Don't worry, we're here to help!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <button 
                  onClick={this.handleRetry}
                  className="flex-1 bg-gradient-to-r from-[#1dc071] to-[#16a05d] text-white px-4 py-3 rounded-[16px] font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#1dc071]/25"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-[#4a5568] text-white px-4 py-3 rounded-[16px] font-semibold transition-all duration-300 hover:bg-[#5a6578]"
                >
                  Refresh Page
                </button>
              </div>

              {this.state.retryCount > 2 && (
                <div className="text-center">
                  <p className="text-sm text-[#808191] mb-2">
                    Still having issues? Try clearing your browser cache or contact support.
                  </p>
                </div>
              )}

              {isDevelopment && this.state.error && (
                <details className="mt-4 p-4 bg-[#1a1a20] rounded-[12px] border border-[#2c2f32]">
                  <summary className="cursor-pointer text-sm text-[#808191] mb-2">
                    Developer Info (Click to expand)
                  </summary>
                  <div className="text-xs font-mono text-red-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        <br /><br />
                        <strong>Component Stack:</strong>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Environment Configuration
const getEnvironmentConfig = () => {
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;
  const environment = import.meta.env.MODE;
  
  // Validate required environment variables
  const requiredVars = {
    VITE_THIRDWEB_CLIENT_ID: clientId
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    
    if (environment === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return {
    clientId: clientId || 'demo-client-id', // Fallback for development
    environment,
    isDevelopment: environment === 'development',
    isProduction: environment === 'production'
  };
};

// Main App Initialization
const initializeApp = () => {
  try {
    const config = getEnvironmentConfig();
    
    // Log environment info in development
    if (config.isDevelopment) {
      console.log('🚀 Crowdfunding DApp - Development Mode');
      console.log('Environment:', config.environment);
      console.log('Client ID:', config.clientId ? '✅ Set' : '❌ Missing');
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThirdwebProvider 
            activeChain={Sepolia}
            clientId={config.clientId}
            dAppMeta={{
              name: "Crowdfunding DApp",
              description: "Decentralized crowdfunding platform built with React and Thirdweb",
              logoUrl: "/logo.png", // Update with your actual logo path
              url: window.location.origin,
              isDarkMode: true
            }}
            supportedWallets={[
              "metamask",
              "walletConnect",
              "coinbaseWallet",
              "injected"
            ]}
            theme={{
              colors: {
                primaryButtonBg: "#1dc071",
                primaryButtonText: "#ffffff",
                secondaryButtonBg: "#2c2f32",
                secondaryButtonText: "#ffffff",
                accent: "#1dc071",
                background: "#1c1c24",
                foreground: "#ffffff"
              }
            }}
          >
            <Router>
              <StateContextProvider>
                <React.Suspense fallback={<LoadingSpinner />}>
                  <App />
                </React.Suspense>
              </StateContextProvider>
            </Router>
          </ThirdwebProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );

  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // Render a basic error page if app initialization fails
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <div className="min-h-screen bg-[#1c1c24] flex items-center justify-center p-4">
        <div className="bg-[#2c2f32] p-8 rounded-[20px] text-white text-center max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-400">Initialization Failed</h2>
          <p className="mb-4 text-[#808191]">
            The application failed to start. Please check your configuration and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#1dc071] px-6 py-3 rounded-[16px] font-semibold transition-all duration-300 hover:bg-[#16a05d]"
          >
            Reload Application
          </button>
          {error.message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[12px] text-sm text-red-400">
              {error.message}
            </div>
          )}
        </div>
      </div>
    );
  }
};

// Initialize the application
initializeApp();
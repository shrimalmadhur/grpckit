import React, { useEffect, useState } from 'react';
import ConnectScreen from './pages/ConnectScreen';
import ServiceExplorer from './components/ServiceExplorer';
import RequestBuilder from './components/RequestBuilder';
import ResponsePanel from './components/ResponsePanel';
import StreamConsole from './components/StreamConsole';
import HistoryDrawer from './components/HistoryDrawer';
import NotificationManager from './components/NotificationManager';
import SettingsPanel from './components/SettingsPanel';
import { useAppStore } from '../store/appStore';

const App: React.FC = () => {
  const [, setIsConnected] = useState(false);
  const [currentView, setCurrentView] = useState<'connect' | 'main'>('connect');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { settings, loadSettings } = useAppStore();

  useEffect(() => {
    console.log('App component mounted');
    console.log('Window APIs available:', {
      grpcApi: typeof window !== 'undefined' && !!window.grpcApi,
      storeApi: typeof window !== 'undefined' && !!window.storeApi,
      appApi: typeof window !== 'undefined' && !!window.appApi,
    });
    
    // Initialize app with timeout protection
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Set a timeout to ensure we don't get stuck
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), 3000);
        });
        
        const initPromise = (async () => {
          // Load settings on app start
          console.log('Loading settings...');
          try {
            await loadSettings();
            console.log('Settings loaded');
          } catch (settingsError) {
            console.error('Settings loading failed:', settingsError);
            // Continue anyway
          }
          
          // Set up proto file import listener
          if (typeof window !== 'undefined' && window.appApi) {
            console.log('Setting up proto file listener...');
            window.appApi.onProtoFileImported((filePath) => {
              console.log('Proto file imported:', filePath);
              // Handle proto file import
            });
          } else {
            console.log('appApi not available');
          }
        })();
        
        await Promise.race([initPromise, timeoutPromise]);
        
        console.log('Setting isReady to true...');
        setIsReady(true);
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        console.log('Setting isReady to true despite error...');
        setIsReady(true); // Still set ready so UI can show
      }
    };

    initializeApp();

    return () => {
      if (typeof window !== 'undefined' && window.appApi) {
        window.appApi.removeAllListeners('proto-file-imported');
      }
    };
  }, [loadSettings]);

  useEffect(() => {
    // Apply theme
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleConnect = async (url: string, options: any) => {
    try {
      if (typeof window !== 'undefined' && window.grpcApi) {
        const result = await window.grpcApi.connect(url, options);
        if (result.success) {
          setIsConnected(true);
          setCurrentView('main');
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('gRPC API not available');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      // Handle connection error
    }
  };

  const handleDisconnect = async () => {
    try {
      if (typeof window !== 'undefined' && window.grpcApi) {
        await window.grpcApi.disconnect();
      }
      setIsConnected(false);
      setCurrentView('connect');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing GRPCKit...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'connect') {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <ConnectScreen onConnect={handleConnect} />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                GRPCKit
              </h1>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Connected</span>
            </div>
          </div>
          
          <ServiceExplorer />
          
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDisconnect}
              className="w-full btn btn-secondary"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="flex-1 flex">
            {/* Request Panel */}
            <div className="flex-1 flex flex-col">
              <RequestBuilder />
              <ResponsePanel />
            </div>
            
            {/* Stream Console */}
            <div className="w-80 border-l border-gray-200 dark:border-gray-700">
              <StreamConsole />
            </div>
          </div>
        </div>

        {/* History Drawer */}
        <HistoryDrawer />
      </div>

      {/* Notification Manager */}
      <NotificationManager />
      
      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default App; 
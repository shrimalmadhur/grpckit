import React, { useState } from 'react';

interface ConnectScreenProps {
  onConnect: (url: string, options: any) => Promise<void>;
}

const ConnectScreen: React.FC<ConnectScreenProps> = ({ onConnect }) => {
  const [url, setUrl] = useState('localhost:50051');
  const [useTls, setUseTls] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!url.trim()) {
      setError('Please enter a server URL');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      await onConnect(url.trim(), { useTls });
      
      // Show success notification
      if ((window as any).showNotification) {
        (window as any).showNotification({
          type: 'success',
          title: 'Connected successfully',
          message: `Connected to ${url.trim()}`,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      
      // Show error notification
      if ((window as any).showNotification) {
        (window as any).showNotification({
          type: 'error',
          title: 'Connection failed',
          message: errorMessage,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Connect to gRPC Server
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter the server address to get started
          </p>
        </div>
        
        <div className="card p-6 space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Server URL
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="localhost:50051"
              className="input mt-1"
              disabled={isConnecting}
            />
          </div>

          <div className="flex items-center">
            <input
              id="use-tls"
              type="checkbox"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isConnecting}
            />
            <label htmlFor="use-tls" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Use TLS
            </label>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Use Cmd+O (Mac) or Ctrl+O (Windows/Linux) to import .proto files
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectScreen; 
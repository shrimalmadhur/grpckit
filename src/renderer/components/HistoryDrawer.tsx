import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

const HistoryDrawer: React.FC = () => {
  const { history, clearHistory } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'environments'>('history');

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyAsGrpcurl = (item: any) => {
    const command = `grpcurl -plaintext ${item.url} ${item.serviceName}/${item.methodName} -d '${JSON.stringify(item.request)}'`;
    navigator.clipboard.writeText(command);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
      >
        📋
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    History & Environments
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'history'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setActiveTab('environments')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'environments'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Environments
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'history' ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Request History ({history.length})
                      </h3>
                      {history.length > 0 && (
                        <button
                          onClick={clearHistory}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {item.serviceName}/{item.methodName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.url}
                                </p>
                              </div>
                              <button
                                onClick={() => copyAsGrpcurl(item)}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 ml-2"
                                title="Copy as grpcurl command"
                              >
                                📋
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDuration(item.duration)}</span>
                              <span>{formatTimestamp(item.timestamp)}</span>
                            </div>

                            {item.error && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                                {item.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Environments
                      </h3>
                      <button className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        + New
                      </button>
                    </div>

                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No environments yet</p>
                      <p className="text-xs mt-1">Create environments to manage variables</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryDrawer; 
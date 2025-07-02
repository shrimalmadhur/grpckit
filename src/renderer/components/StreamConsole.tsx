import React, { useState } from 'react';

interface StreamLog {
  id: string;
  timestamp: number;
  type: 'info' | 'error' | 'data';
  message: string;
  data?: any;
}

const StreamConsole: React.FC = () => {
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // const addLog = (type: StreamLog['type'], message: string, data?: any) => {
  //   if (isPaused) return;
  //   const log: StreamLog = {
  //     id: Date.now().toString(),
  //     timestamp: Date.now(),
  //     type,
  //     message,
  //     data,
  //   };
  //   setLogs(prev => [...prev, log]);
  // };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (type: StreamLog['type']) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'error':
        return '❌';
      case 'data':
        return '📄';
      default:
        return '•';
    }
  };

  const getLogColor = (type: StreamLog['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'data':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Stream Console
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`text-xs px-2 py-1 rounded ${
                isPaused
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={clearLogs}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No stream logs yet</p>
            <p className="text-xs mt-1">Streaming responses will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs">
                <div className="flex items-start space-x-2">
                  <span className="text-gray-400 dark:text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">
                    {getLogIcon(log.type)}
                  </span>
                  <span className={`flex-1 ${getLogColor(log.type)}`}>
                    {log.message}
                  </span>
                </div>
                {log.data && (
                  <div className="ml-8 mt-1">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamConsole; 
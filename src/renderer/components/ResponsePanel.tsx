import React from 'react';
import { useAppStore } from '../../store/appStore';

const ResponsePanel: React.FC = () => {
  const { response } = useAppStore();

  if (!response.timestamp) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No response yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Response
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          {response.duration && (
            <span>Duration: {response.duration}ms</span>
          )}
          {response.timestamp && (
            <span>Time: {new Date(response.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {response.error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Error
          </h3>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {response.error}
          </pre>
        </div>
      ) : response.responseData ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response Data
          </h3>
          <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap overflow-x-auto">
            {response.responseData}
          </pre>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No response data</p>
        </div>
      )}
    </div>
  );
};

export default ResponsePanel; 
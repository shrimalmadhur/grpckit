import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

const RequestBuilder: React.FC = () => {
  const { connection, request, updateRequest, setResponse, addToHistory } = useAppStore();
  const [isSending, setIsSending] = useState(false);

  const selectedService = connection.services.find(s => s.name === connection.selectedService);
  const selectedMethod = selectedService?.methods.find(m => m.name === connection.selectedMethod);

  const handleSend = async () => {
    if (!connection.selectedService || !connection.selectedMethod) {
      return;
    }

    setIsSending(true);
    const startTime = Date.now();

    try {
      let requestData;
      try {
        requestData = JSON.parse(request.requestData);
      } catch (error) {
        throw new Error('Invalid JSON in request data');
      }

      const result = await window.grpcApi.invokeUnary(
        connection.selectedService,
        connection.selectedMethod,
        requestData,
        {
          metadata: request.metadata,
          deadline: request.timeout,
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        setResponse({
          responseData: JSON.stringify(result.response, null, 2),
          duration,
          timestamp: Date.now(),
        });

        // Add to history
        addToHistory({
          url: connection.url,
          serviceName: connection.selectedService,
          methodName: connection.selectedMethod,
          request: requestData,
          response: result.response,
          duration,
          timestamp: Date.now(),
        });

        // Show success notification
        if ((window as any).showNotification) {
          (window as any).showNotification({
            type: 'success',
            title: 'Request successful',
            message: `Response received in ${duration}ms`,
          });
        }
      } else {
        const errorMessage = result.error || 'Unknown error';
        setResponse({
          error: errorMessage,
          duration,
          timestamp: Date.now(),
        });

        // Show error notification
        if ((window as any).showNotification) {
          (window as any).showNotification({
            type: 'error',
            title: 'Request failed',
            message: errorMessage,
          });
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setResponse({
        error: error instanceof Error ? error.message : 'Request failed',
        duration,
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const addMetadata = () => {
    const newKey = `key${Object.keys(request.metadata).length + 1}`;
    updateRequest({
      metadata: { ...request.metadata, [newKey]: '' },
    });
  };

  const updateMetadata = (key: string, value: string) => {
    const newMetadata = { ...request.metadata };
    if (value === '') {
      delete newMetadata[key];
    } else {
      newMetadata[key] = value;
    }
    updateRequest({ metadata: newMetadata });
  };

  if (!selectedService || !selectedMethod) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Select a service and method to start building requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Request Builder
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedService.name} / {selectedMethod.name}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Request Data (JSON)
          </label>
          <textarea
            value={request.requestData}
            onChange={(e) => updateRequest({ requestData: e.target.value })}
            className="input font-mono text-sm h-32 resize-none"
            placeholder="{}"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Metadata
            </label>
            <button
              onClick={addMetadata}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(request.metadata).map(([key, value]) => (
              <div key={key} className="flex space-x-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newMetadata = { ...request.metadata };
                    delete newMetadata[key];
                    newMetadata[e.target.value] = value;
                    updateRequest({ metadata: newMetadata });
                  }}
                  className="input flex-1 text-sm"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateMetadata(key, e.target.value)}
                  className="input flex-1 text-sm"
                  placeholder="Value"
                />
                <button
                  onClick={() => updateMetadata(key, '')}
                  className="px-2 py-1 text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timeout (ms)
          </label>
          <input
            type="number"
            value={request.timeout}
            onChange={(e) => updateRequest({ timeout: parseInt(e.target.value) || 30000 })}
            className="input w-32"
            min="1000"
            max="300000"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isSending}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );
};

export default RequestBuilder; 
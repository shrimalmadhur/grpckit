import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

const ServiceExplorer: React.FC = () => {
  const { connection, selectService, selectMethod } = useAppStore();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('[ServiceExplorer] Connection state changed:', {
      isConnected: connection.isConnected,
      servicesCount: connection.services?.length || 0,
      services: connection.services,
      discoveryError: connection.discoveryError
    });
  }, [connection]);

  const toggleService = (serviceName: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceName)) {
      newExpanded.delete(serviceName);
    } else {
      newExpanded.add(serviceName);
    }
    setExpandedServices(newExpanded);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (typeof window !== 'undefined' && window.grpcApi) {
        // eslint-disable-next-line no-console
        console.log('[ServiceExplorer] Manually triggering service discovery...');
        const discoveryResult = await window.grpcApi.discover();
        // eslint-disable-next-line no-console
        console.log('[ServiceExplorer] Discovery result:', discoveryResult);
        if (discoveryResult.success && discoveryResult.services) {
          // Update the entire connection state, not just services
          useAppStore.setState({
            connection: {
              ...useAppStore.getState().connection,
              isConnected: true,
              services: discoveryResult.services,
              discoveryError: undefined,
            },
          });
        } else {
          // Update connection state with error
          useAppStore.setState({
            connection: {
              ...useAppStore.getState().connection,
              isConnected: true,
              services: [],
              discoveryError: discoveryResult.error || 'No services discovered',
            },
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ServiceExplorer] Manual discovery failed:', err);
      // Update connection state with error
      useAppStore.setState({
        connection: {
          ...useAppStore.getState().connection,
          isConnected: true,
          services: [],
          discoveryError: err instanceof Error ? err.message : String(err),
        },
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (!connection.isConnected) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Not connected
        </p>
        <div className="flex justify-center mt-2">
          <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Services'}
          </button>
        </div>
      </div>
    );
  }

  // Log discovered services for debugging
  if (connection.services) {
    // eslint-disable-next-line no-console
    console.log('[ServiceExplorer] Discovered services:', connection.services);
  }

  if (connection.discoveryError) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Service discovery error: {connection.discoveryError}
        </p>
        <div className="flex justify-center mt-2">
          <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Services'}
          </button>
        </div>
      </div>
    );
  }

  if (connection.services.length === 0) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No services discovered
        </p>
        <div className="flex justify-center mt-2">
          <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Services'}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          Try importing a .proto file or refreshing
        </p>
      </div>
    );
  }

  // Fallback: if neither services nor errors, show a message
  if (!connection.services && !connection.discoveryError) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
          No services or errors present. Try refreshing.
        </p>
        <div className="flex justify-center mt-2">
          <button onClick={handleRefresh} className="btn btn-secondary" disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Services'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Services ({connection.services.length})
        </h3>
        
        {connection.services.map((service) => (
          <div key={service.name} className="mb-1">
            <button
              onClick={() => toggleService(service.name)}
              className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                connection.selectedService === service.name
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{service.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {service.methods.length}
                </span>
              </div>
            </button>
            
            {expandedServices.has(service.name) && (
              <div className="ml-4 mt-1 space-y-1">
                {service.methods.map((method) => (
                  <button
                    key={method.name}
                    onClick={() => {
                      selectService(service.name);
                      selectMethod(method.name);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      connection.selectedService === service.name && connection.selectedMethod === method.name
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="truncate">{method.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {method.requestStream ? '→' : '•'}
                        {method.responseStream ? '→' : '•'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceExplorer; 
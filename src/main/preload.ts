import { contextBridge, ipcRenderer } from 'electron';

// Types for the exposed API
export interface GrpcService {
  name: string;
  methods: GrpcMethod[];
}

export interface GrpcMethod {
  name: string;
  requestType: string;
  responseType: string;
  requestStream: boolean;
  responseStream: boolean;
}

export interface ConnectionOptions {
  useTls?: boolean;
  caCert?: string;
  clientCert?: string;
  clientKey?: string;
  metadata?: Record<string, string>;
  deadline?: number;
}

export interface GrpcResponse {
  success: boolean;
  response?: any;
  error?: string;
}

export interface DiscoveryResponse {
  success: boolean;
  services?: GrpcService[];
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('grpcApi', {
  // Connection management
  connect: (url: string, options: ConnectionOptions): Promise<GrpcResponse> =>
    ipcRenderer.invoke('grpc-connect', url, options),
  
  disconnect: (): Promise<GrpcResponse> =>
    ipcRenderer.invoke('grpc-disconnect'),
  
  // Service discovery
  discover: (): Promise<DiscoveryResponse> =>
    ipcRenderer.invoke('grpc-discover'),
  
  // Method invocation
  invokeUnary: (
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<GrpcResponse> =>
    ipcRenderer.invoke('grpc-invoke-unary', serviceName, methodName, request, options),
  
  invokeStream: (
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<GrpcResponse> =>
    ipcRenderer.invoke('grpc-invoke-stream', serviceName, methodName, request, options),
  
  // Proto file import
  importProto: (filePath: string): Promise<GrpcResponse> =>
    ipcRenderer.invoke('proto-import', filePath),
});

contextBridge.exposeInMainWorld('storeApi', {
  // Store operations
  get: (key: string): Promise<any> =>
    ipcRenderer.invoke('store-get', key),
  
  set: (key: string, value: any): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('store-set', key, value),
  
  delete: (key: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('store-delete', key),
});

contextBridge.exposeInMainWorld('appApi', {
  // App-specific operations
  onProtoFileImported: (callback: (filePath: string) => void) => {
    ipcRenderer.on('proto-file-imported', (_, filePath: string) => callback(filePath));
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type declarations for the exposed APIs
declare global {
  interface Window {
    grpcApi: {
      connect: (url: string, options: ConnectionOptions) => Promise<GrpcResponse>;
      disconnect: () => Promise<GrpcResponse>;
      discover: () => Promise<DiscoveryResponse>;
      invokeUnary: (
        serviceName: string,
        methodName: string,
        request: any,
        options?: { metadata?: Record<string, string>; deadline?: number }
      ) => Promise<GrpcResponse>;
      invokeStream: (
        serviceName: string,
        methodName: string,
        request: any,
        options?: { metadata?: Record<string, string>; deadline?: number }
      ) => Promise<GrpcResponse>;
      importProto: (filePath: string) => Promise<GrpcResponse>;
    };
    storeApi: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<{ success: boolean }>;
      delete: (key: string) => Promise<{ success: boolean }>;
    };
    appApi: {
      onProtoFileImported: (callback: (filePath: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
} 
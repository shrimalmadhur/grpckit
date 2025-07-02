export interface GrpcApi {
  connect: (url: string, options?: any) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  discover: () => Promise<{ success: boolean; services?: any[]; error?: string }>;
  invokeUnary: (serviceName: string, methodName: string, request: any, options?: any) => Promise<{ success: boolean; response?: any; error?: string }>;
  invokeStream: (serviceName: string, methodName: string, request: any, options?: any) => Promise<{ success: boolean; error?: string }>;
  importProto: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface StoreApi {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface AppApi {
  onProtoFileImported: (callback: (filePath: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    grpcApi: GrpcApi;
    storeApi: StoreApi;
    appApi: AppApi;
    showNotification?: (notification: {
      type: 'success' | 'error' | 'warning' | 'info';
      title: string;
      message?: string;
      duration?: number;
    }) => void;
  }
} 
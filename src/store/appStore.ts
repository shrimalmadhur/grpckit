import { create } from 'zustand';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  autoConnect: boolean;
  defaultTimeout: number;
}

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

export interface ConnectionState {
  isConnected: boolean;
  url: string;
  services: GrpcService[];
  selectedService?: string;
  selectedMethod?: string | undefined;
  discoveryError?: string | undefined;
}

export interface RequestState {
  requestData: string;
  metadata: Record<string, string>;
  timeout: number;
}

export interface ResponseState {
  responseData?: string;
  error?: string;
  duration?: number;
  timestamp?: number;
}

interface AppStore {
  // Settings
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Connection
  connection: ConnectionState;
  connect: (url: string, options?: any) => Promise<void>;
  disconnect: () => Promise<void>;
  setServices: (services: GrpcService[]) => void;
  selectService: (serviceName: string) => void;
  selectMethod: (methodName: string) => void;

  // Request/Response
  request: RequestState;
  response: ResponseState;
  updateRequest: (updates: Partial<RequestState>) => void;
  setResponse: (response: ResponseState) => void;
  clearResponse: () => void;

  // History
  history: any[];
  addToHistory: (item: any) => void;
  clearHistory: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 14,
  autoConnect: false,
  defaultTimeout: 30000,
};

const defaultConnection: ConnectionState = {
  isConnected: false,
  url: '',
  services: [],
  discoveryError: undefined,
};

const defaultRequest: RequestState = {
  requestData: '{}',
  metadata: {},
  timeout: 30000,
};

const defaultResponse: ResponseState = {};

export const useAppStore = create<AppStore>((set, get) => ({
  // Settings
  settings: defaultSettings,

  loadSettings: async () => {
    try {
      if (typeof window !== 'undefined' && window.storeApi) {
        const settings = await window.storeApi.get('settings');
        if (settings) {
          set({ settings: { ...defaultSettings, ...settings } });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    try {
      if (typeof window !== 'undefined' && window.storeApi) {
        await window.storeApi.set('settings', newSettings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Connection
  connection: defaultConnection,

  connect: async (url, options) => {
    try {
      if (typeof window !== 'undefined' && window.grpcApi) {
        const result = await window.grpcApi.connect(url, options);
        // eslint-disable-next-line no-console
        console.log('[appStore] grpcApi.connect result:', result);
        if (result.success) {
          // eslint-disable-next-line no-console
          console.log('[appStore] Calling window.grpcApi.discover...');
          const discoveryResult = await window.grpcApi.discover();
          // eslint-disable-next-line no-console
          console.log('[appStore] discoveryResult', discoveryResult);
          if (discoveryResult.success && discoveryResult.services) {
            set({
              connection: {
                isConnected: true,
                url,
                services: discoveryResult.services,
                discoveryError: undefined,
              },
            });
          } else {
            // Set isConnected true even if discovery fails, so UI can show refresh button and error
            set({
              connection: {
                isConnected: true,
                url,
                services: [],
                discoveryError:
                  discoveryResult.error || 'No services discovered',
              },
            });
          }
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('gRPC API not available');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[appStore] Connection failed:', error);
      set({
        connection: {
          isConnected: false,
          url,
          services: [],
          discoveryError:
            error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      if (typeof window !== 'undefined' && window.grpcApi) {
        await window.grpcApi.disconnect();
      }
      set({ connection: defaultConnection });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  },

  setServices: (services) => {
    set((state) => ({
      connection: {
        ...state.connection,
        services,
        isConnected: true, // Set connected to true when services are loaded from proto
        discoveryError: undefined, // Clear any previous errors
      },
    }));
  },

  selectService: (serviceName) => {
    set((state) => ({
      connection: {
        ...state.connection,
        selectedService: serviceName,
        selectedMethod: undefined as string | undefined,
      },
    }));
  },

  selectMethod: (methodName) => {
    set((state) => ({
      connection: { ...state.connection, selectedMethod: methodName },
    }));
  },

  // Request/Response
  request: defaultRequest,
  response: defaultResponse,

  updateRequest: (updates) => {
    set((state) => ({
      request: { ...state.request, ...updates },
    }));
  },

  setResponse: (response) => {
    set({ response });
  },

  clearResponse: () => {
    set({ response: defaultResponse });
  },

  // History
  history: [],

  addToHistory: (item) => {
    set((state) => ({
      history: [item, ...state.history].slice(0, 100), // Keep last 100 items
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },
}));

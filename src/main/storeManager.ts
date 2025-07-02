import Store from 'electron-store';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  autoConnect: boolean;
  defaultTimeout: number;
}

export interface GrpcHistoryItem {
  id: string;
  timestamp: number;
  url: string;
  serviceName: string;
  methodName: string;
  request: any;
  response?: any;
  error?: string;
  duration: number;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  metadata: Record<string, string>;
}

export interface EnvironmentUpdate {
  name?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface AppStore {
  settings: AppSettings;
  history: GrpcHistoryItem[];
  environments: Environment[];
  recentConnections: string[];
}

export class StoreManager {
  private settingsStore: Store<AppSettings>;
  private historyStore: Store<{ history: GrpcHistoryItem[] }>;
  private environmentsStore: Store<{ environments: Environment[] }>;
  private connectionsStore: Store<{ recentConnections: string[] }>;

  constructor() {
    this.settingsStore = new Store<AppSettings>({
      name: 'settings',
      defaults: {
        theme: 'system',
        fontSize: 14,
        autoConnect: false,
        defaultTimeout: 30000,
      },
    });

    this.historyStore = new Store<{ history: GrpcHistoryItem[] }>({
      name: 'history',
      defaults: {
        history: [],
      },
    });

    this.environmentsStore = new Store<{ environments: Environment[] }>({
      name: 'environments',
      defaults: {
        environments: [],
      },
    });

    this.connectionsStore = new Store<{ recentConnections: string[] }>({
      name: 'connections',
      defaults: {
        recentConnections: [],
      },
    });
  }

  // Settings methods
  getSettings(): AppSettings {
    return this.settingsStore.store;
  }

  updateSettings(settings: Partial<AppSettings>): void {
    this.settingsStore.set(settings);
  }

  // History methods
  getHistory(): GrpcHistoryItem[] {
    return this.historyStore.get('history', []);
  }

  addHistoryItem(item: Omit<GrpcHistoryItem, 'id' | 'timestamp'>): void {
    const history = this.getHistory();
    const newItem: GrpcHistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    // Keep only last 100 items
    const updatedHistory = [newItem, ...history].slice(0, 100);
    this.historyStore.set('history', updatedHistory);
  }

  clearHistory(): void {
    this.historyStore.set('history', []);
  }

  // Environment methods
  getEnvironments(): Environment[] {
    return this.environmentsStore.get('environments', []);
  }

  addEnvironment(environment: Omit<Environment, 'id'>): void {
    const environments = this.getEnvironments();
    const newEnvironment: Environment = {
      ...environment,
      id: Math.random().toString(36).substr(2, 9),
    };

    this.environmentsStore.set('environments', [...environments, newEnvironment]);
  }

  updateEnvironment(id: string, updates: Partial<Omit<Environment, 'id'>>): void {
    const environments = this.getEnvironments();
    const index = environments.findIndex(env => env.id === id);
    
    if (index !== -1 && environments[index]) {
      const currentEnv = environments[index];
      const updatedEnvironment: Environment = {
        ...currentEnv,
        ...updates,
        id,
      };
      environments[index] = updatedEnvironment;
      this.environmentsStore.set('environments', environments);
    }
  }

  deleteEnvironment(id: string): void {
    const environments = this.getEnvironments();
    const filtered = environments.filter(env => env.id !== id);
    this.environmentsStore.set('environments', filtered);
  }

  // Connection methods
  getRecentConnections(): string[] {
    return this.connectionsStore.get('recentConnections', []);
  }

  addRecentConnection(url: string): void {
    const connections = this.getRecentConnections();
    const filtered = connections.filter(conn => conn !== url);
    const updated = [url, ...filtered].slice(0, 10); // Keep last 10
    this.connectionsStore.set('recentConnections', updated);
  }

  // Generic store methods
  get(key: string): any {
    switch (key) {
      case 'settings':
        return this.getSettings();
      case 'history':
        return this.getHistory();
      case 'environments':
        return this.getEnvironments();
      case 'recentConnections':
        return this.getRecentConnections();
      default:
        return null;
    }
  }

  set(key: string, value: any): void {
    switch (key) {
      case 'settings':
        this.updateSettings(value);
        break;
      case 'history':
        this.historyStore.set('history', value);
        break;
      case 'environments':
        this.environmentsStore.set('environments', value);
        break;
      case 'recentConnections':
        this.connectionsStore.set('recentConnections', value);
        break;
    }
  }

  delete(key: string): void {
    switch (key) {
      case 'history':
        this.clearHistory();
        break;
      case 'environments':
        this.environmentsStore.set('environments', []);
        break;
      case 'recentConnections':
        this.connectionsStore.set('recentConnections', []);
        break;
    }
  }
} 
import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import * as path from 'path';
import { GrpcEngine } from './grpcEngine';
import { StoreManager } from './storeManager';

let mainWindow: BrowserWindow | null = null;
let grpcEngine: GrpcEngine;
let storeManager: StoreManager;

console.log('Starting Electron main process...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

function createWindow(): void {
  console.log('Creating BrowserWindow...');
  try {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: true, // Force show immediately for debugging
    });

    const rendererPath = path.join(__dirname, '..', 'renderer.html');
    console.log('Loading renderer.html from:', rendererPath);
    mainWindow.loadFile(rendererPath).catch((err) => {
      console.error('Failed to load renderer.html:', err);
    });

    mainWindow.on('ready-to-show', () => {
      console.log('Window ready to show');
      mainWindow?.show();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription) => {
        console.error('Failed to load page:', errorCode, errorDescription);
      }
    );

    // Development: Open DevTools
    if (process.env['NODE_ENV'] === 'development') {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Proto File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [{ name: 'Protocol Buffers', extensions: ['proto'] }],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send(
                'proto-file-imported',
                result.filePaths[0]
              );
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIpcHandlers(): void {
  // gRPC Connection
  ipcMain.handle('grpc-connect', async (_, url: string, options: any) => {
    try {
      await grpcEngine.connect(url, options);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('grpc-disconnect', async () => {
    try {
      await grpcEngine.disconnect();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Service Discovery
  ipcMain.handle('grpc-discover', async () => {
    try {
      const services = await grpcEngine.discover();
      return { success: true, services };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Method Invocation
  ipcMain.handle(
    'grpc-invoke-unary',
    async (
      _,
      serviceName: string,
      methodName: string,
      request: any,
      options: any
    ) => {
      try {
        const response = await grpcEngine.invokeUnary(
          serviceName,
          methodName,
          request,
          options
        );
        return { success: true, response };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  ipcMain.handle(
    'grpc-invoke-stream',
    async (
      _,
      serviceName: string,
      methodName: string,
      request: any,
      options: any
    ) => {
      try {
        const stream = await grpcEngine.invokeStream(
          serviceName,
          methodName,
          request,
          options
        );
        return { success: true, streamId: stream.id };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Store Management
  ipcMain.handle('store-get', async (_, key: string) => {
    return storeManager.get(key);
  });

  ipcMain.handle('store-set', async (_, key: string, value: any) => {
    storeManager.set(key, value);
    return { success: true };
  });

  ipcMain.handle('store-delete', async (_, key: string) => {
    storeManager.delete(key);
    return { success: true };
  });

  // Proto File Import
  ipcMain.handle('proto-import', async (_, filePath: string) => {
    try {
      const services = await grpcEngine.importProto(filePath);
      return { success: true, services: services };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

app
  .whenReady()
  .then(() => {
    console.log('App is ready');
    try {
      grpcEngine = new GrpcEngine();
      storeManager = new StoreManager();

      createWindow();
      createMenu();
      setupIpcHandlers();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  })
  .catch((error) => {
    console.error('Error in app.whenReady():', error);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (grpcEngine) {
    await grpcEngine.disconnect();
  }
});

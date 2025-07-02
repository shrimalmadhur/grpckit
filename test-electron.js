const { app, BrowserWindow } = require('electron');
console.log('Test Electron main process starting...');
app.whenReady().then(() => {
  console.log('App is ready');
  const win = new BrowserWindow({ width: 400, height: 300 });
  win.loadURL('about:blank');
}); 
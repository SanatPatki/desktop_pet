import { app, ipcMain } from 'electron';
import { createOverlayWindow } from './overlay.js';

let overlayWindow;

ipcMain.handle('pet:get-state', () => ({ character: 'dragon' }));

app.whenReady().then(() => {
  overlayWindow = createOverlayWindow();

  app.on('activate', () => {
    if (!overlayWindow) {
      overlayWindow = createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  overlayWindow?.destroy();
});

import electron from 'electron';

const { app, ipcMain } = electron;
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOverlayWindow } from './overlay.js';
import { loadSettings } from './settings-store.js';
import { createTray } from './tray.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let overlayWindow;
let tray;
let petState = { character: 'phoenix' };
let settingsFile;

ipcMain.handle('pet:get-state', () => petState);

app.whenReady().then(() => {
  settingsFile = join(app.getPath('userData'), 'desktop-pet.json');
  petState = loadSettings(settingsFile);
  overlayWindow = createOverlayWindow();
  tray = createTray();

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
  tray?.destroy();
  overlayWindow?.destroy();
});

import { BrowserWindow, screen } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createOverlayWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  const overlay = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '..', 'preload', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true);
  overlay.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  overlay.loadFile(join(__dirname, '..', 'renderer', 'index.html'));

  const cursorTimer = setInterval(() => {
    if (overlay.isDestroyed()) {
      return;
    }

    const cursor = screen.getCursorScreenPoint();
    const bounds = overlay.getBounds();
    overlay.webContents.send('pet:cursor', {
      x: cursor.x - bounds.x,
      y: cursor.y - bounds.y,
    });
  }, 50);

  overlay.on('closed', () => clearInterval(cursorTimer));
  return overlay;
}

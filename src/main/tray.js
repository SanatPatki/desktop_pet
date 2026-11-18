import electron from 'electron';

const { app, Menu, Tray } = electron;
import { createTrayIcon } from './tray-icon.js';

export function createTray() {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip('Desktop Pet');

  function buildMenu() {
    return Menu.buildFromTemplate([
      {
        label: 'Phoenix',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);
  }

  function refresh() {
    tray.setContextMenu(buildMenu());
  }

  refresh();

  return {
    refresh,
    destroy: () => tray.destroy(),
  };
}

import electron from 'electron';

const { app, Menu, Tray } = electron;
import { createTrayIcon } from './tray-icon.js';

export function createTray({ getState, setCharacter }) {
  const tray = new Tray(createTrayIcon());
  tray.setToolTip('Desktop Pet');

  function buildMenu() {
    const state = getState();
    return Menu.buildFromTemplate([
      {
        label: 'Dragon',
        type: 'radio',
        checked: state.character === 'dragon',
        click: () => setCharacter('dragon'),
      },
      {
        label: 'Phoenix',
        type: 'radio',
        checked: state.character === 'phoenix',
        click: () => setCharacter('phoenix'),
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

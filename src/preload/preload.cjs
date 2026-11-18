const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, listener) {
  const wrappedListener = (_event, payload) => listener(payload);
  ipcRenderer.on(channel, wrappedListener);
  return () => ipcRenderer.removeListener(channel, wrappedListener);
}

contextBridge.exposeInMainWorld('desktopPet', {
  getState: () => ipcRenderer.invoke('pet:get-state'),
  onState: (listener) => subscribe('pet:state', listener),
  onCursor: (listener) => subscribe('pet:cursor', listener),
});

# desktop_pet

A tiny Electron desktop pet. A pixel-art dragon or phoenix roams your desktop, and dragging your cursor across it triggers a petting reaction with hearts.

## Run

```sh
npm install
npm start
```

The pet runs in a transparent, click-through overlay on the primary display.

## Controls

Click the menu bar tray icon and choose **Dragon** or **Phoenix**. The choice is saved between launches. Choose **Quit** to exit.

## How it works

- `src/main/` owns the Electron window, tray menu, cursor polling, and persisted settings.
- `src/renderer/` owns the canvas render loop.
- `src/pet/` owns sprite generation, roaming, cursor hit-testing, and heart particles.
- Sprites are drawn once to low-resolution canvases and scaled with smoothing disabled for crisp pixels.

## Test

```sh
npm test
```

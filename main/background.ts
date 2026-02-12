import path from "path";
import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import mainWindowListener from "./listeners/main-window-listener";
import ipcMainListener from "./listeners/ipc-main-listener";
import { WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH } from "../renderer/const";

export const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

let mainWindow: BrowserWindow;
// stickyWindow is managed inside ipcMainListener (or should be, but currently it's a bit tangled.
// Simplified: passing specific windows to listeners might be better if they need reference, but `stickyWindow` is created dynamically.
// We will modify ipcMainListener to handle its own stickyWindow reference, so we don't need to pass it from here.

(async () => {
  await app.whenReady();

  mainWindow = createWindow("main", {
    minWidth: WINDOW_DEFAULT_WIDTH,
    minHeight: WINDOW_DEFAULT_HEIGHT,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  // Refactored: No longer passing stickyWindow, as it's not initialized yet and should be managed by the listener
  ipcMainListener(mainWindow);
  mainWindowListener(mainWindow);

  // Create System Tray
  const { createTray } = require('./helpers');
  createTray(mainWindow);
})();

app.on("window-all-closed", () => {
  app.quit();
});

app.setLoginItemSettings({
  openAtLogin: true
})

import { BrowserWindow, dialog } from "electron";

export default function mainWindowListener(mainWindow: BrowserWindow) {
  let isQuitting = false;

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Listen for the 'before-quit' event on the app instance
  // This requires importing 'app' from 'electron'
  const { app } = require('electron');
  app.on('before-quit', () => {
    isQuitting = true;
  });
}

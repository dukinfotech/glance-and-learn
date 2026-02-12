import { BrowserWindow, ipcMain, shell } from "electron";
import { createWindow } from "../helpers";
import { settings } from "../stores/settings";
import path from "path";
import { isProd } from "../background";
import stickyWindowListener from "./sticky-window-listener";
import {
  deleteDB,
  insertDB,
  listDB,
  listData,
  updateData,
  selectData,
  getDBFolder,
} from "../helpers/database";

export default function ipcMainListener(
  mainWindow: BrowserWindow
) {
  // Manage stickyWindow state locally within this closure
  let stickyWindow: BrowserWindow | null = null;

  ipcMain.handle("mainWindow.ready", async (event, arg) => {
    // Load user's settings from disk to global state
    mainWindow.webContents.send("setting.load", settings.store);
  });

  ipcMain.handle("stickyWindow.ready", (event, arg) => {
    console.log("stickyWindow.ready");

    // Load user's settings from disk to global state
    if (stickyWindow && !stickyWindow.isDestroyed()) {
      stickyWindow.webContents.send("setting.load", settings.store);
    }
  });

  ipcMain.on("stickyWindow.isShow", async (event, arg) => {
    if (arg) {
      if (stickyWindow && !stickyWindow.isDestroyed()) {
        stickyWindow.show();
        return arg;
      }

      const windowWith = settings.get("stickyWindow.width") as number;
      const windowHeight = settings.get("stickyWindow.height") as number;

      stickyWindow = createWindow("sticky", {
        width: windowWith,
        height: windowHeight,
        x: 0,
        y: 0,
        frame: false,
        alwaysOnTop: true,
        fullscreenable: false,
        maximizable: false,
        minimizable: false,
        resizable: true,
        skipTaskbar: true,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
        },
      });

      stickyWindow.setAlwaysOnTop(true, "screen-saver");
      stickyWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

      if (isProd) {
        await stickyWindow.loadURL("app://./sticky");
      } else {
        const port = process.argv[2];
        await stickyWindow.loadURL(`http://localhost:${port}/sticky`);
        // stickyWindow.webContents.openDevTools(); // Optional
      }

      stickyWindowListener(mainWindow, stickyWindow);
    } else {
      if (stickyWindow && !stickyWindow.isDestroyed()) {
        stickyWindow.close();
      }
    }

    return arg;
  });

  ipcMain.handle("stickyWindow.resize", (event, size) => {
    if (stickyWindow && !stickyWindow.isDestroyed()) {
      stickyWindow.setSize(size.width, size.height, true);
    }
  });

  ipcMain.handle("settings.reset", () => {
    settings.clear();
    return settings.store;
  });

  ipcMain.on("settings.changed", (e, changedSettings) => {
    Object.keys(changedSettings).map((key) => {
      settings.set(key, changedSettings[key]);
    });
  });

  ipcMain.handle("database.insert-data", (event, arg) => {
    insertDB(arg.name, arg.columnNames, arg.data);
  });

  ipcMain.handle("database.list", (event, arg) => {
    return listDB(arg.isWithFileSize);
  });

  ipcMain.handle("database.delete", (event, arg) => {
    deleteDB(arg.name);
  });

  ipcMain.handle("database.list-data", (event, arg) => {
    const data = listData(arg.name, arg.keyword);
    return data;
  });

  ipcMain.handle("database.update-data", (event, arg) => {
    updateData(arg.name, arg.id, arg.field);
  });

  ipcMain.handle("database.select-data", (event, arg) => {
    const data = selectData(arg.name);
    return data;
  });

  ipcMain.handle("database.open-folder", () => {
    shell.openPath(getDBFolder());
  });
}

import { app, Tray, Menu, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import { MESSAGES } from '../../renderer/messages';

let tray: Tray | null = null;

export const createTray = (mainWindow: BrowserWindow) => {
    // In production, app.getAppPath() points to the asar root. 
    // In development, it points to the project root.
    // 'resources' is now included in the files filter in electron-builder.yml
    const iconPath = path.join(app.getAppPath(), 'resources/icon.ico');
    const icon = nativeImage.createFromPath(iconPath);

    if (icon.isEmpty()) {
        console.error('Tray icon is empty. Path might be incorrect:', iconPath);
    }

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: MESSAGES.SHOW_APP,
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: MESSAGES.EXIT,
            click: () => {
                (app as any).isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Glance and Learn');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
};

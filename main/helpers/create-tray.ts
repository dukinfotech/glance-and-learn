
import { app, Tray, Menu, BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export const createTray = (mainWindow: BrowserWindow) => {
    // Icons in build usually go to resources folder in the root or app.asar.unpacked/resources
    // Since we are in main process, we need to find the correct path relative to the build entry point or development path.
    const iconPath = path.join(app.getAppPath(), 'resources/icon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Hiện ứng dụng',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Thoát',
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

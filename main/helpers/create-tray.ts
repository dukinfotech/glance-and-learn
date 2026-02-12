
import { app, Tray, Menu, BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export const createTray = (mainWindow: BrowserWindow) => {
    const iconPath = path.join(__dirname, '../resources/icon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Quit',
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

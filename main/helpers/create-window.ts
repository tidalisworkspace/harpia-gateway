import { Menu } from "electron";
import { Menubar, menubar } from "menubar";
import path from "path";
import logger from "../../shared/logger";

import { isDev, isLinux, isWindows, windowIndex } from "./environment";

let mainMenubar: Menubar;

export function getMainMenubar(): Menubar {
  return mainMenubar;
}

function getIconFilePath() {
  const resourcesDir = path.resolve(path.dirname(__dirname), "resources");
  let iconPath;

  if (isLinux) {
    iconPath = path.resolve(resourcesDir, "icon.png");
  }

  if (isWindows) {
    iconPath = path.resolve(resourcesDir, "icon.ico");
  }

  logger.debug(`app:get-icon-file-path ${iconPath}`);

  return iconPath;
}

export default function (): void {
  const icon = getIconFilePath();

  mainMenubar = menubar({
    preloadWindow: true,
    index: windowIndex,
    icon,
    tooltip: "Harpia Gateway",
    browserWindow: {
      show: isDev,
      frame: isDev,
      width: 450,
      height: 700,
      title: "Harpia Gateway",
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    },
  });

  const gotTheLock = mainMenubar.app.requestSingleInstanceLock();

  if (!gotTheLock) {
    mainMenubar.app.quit();
  }

  mainMenubar.app.on("second-instance", () => {
    if (mainMenubar) {
      mainMenubar.showWindow();
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir",
      click: () => {
        mainMenubar.showWindow();
      },
    },
    {
      label: "Reiniciar",
      click: () => {
        mainMenubar.app.relaunch();
        mainMenubar.app.quit();
      },
    },
    {
      label: "Encerrar",
      click: () => {
        mainMenubar.app.quit();
      },
    },
  ]);

  mainMenubar.on("ready", () => {
    mainMenubar.tray.setContextMenu(contextMenu);
  });
}

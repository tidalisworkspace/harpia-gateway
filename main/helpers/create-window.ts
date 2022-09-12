import { Menu } from "electron";
import { Menubar, menubar } from "menubar";
import path from "path";
import { getIOCounters } from "process";

import { isLinux, isWindows, windowIndex } from "./environment";

let mainMenubar;

export function getMainMenubar(): Menubar {
  return mainMenubar;
}

function getIconFilePath() {
  const resourcesDir = path.resolve(path.dirname(__dirname), "resources");

  if (isLinux) {
    return path.resolve(resourcesDir, "icon.png");
  }

  if (isWindows) {
    return path.resolve(resourcesDir, "icon.ico");
  }

  return null;
}

export default function (): void {
  const icon = getIconFilePath();

  mainMenubar = menubar({
    preloadWindow: true,
    index: windowIndex,
    icon,
    tooltip: "Harpia Gateway",
    browserWindow: {
      icon,
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

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir",
      click: () => {
        mainMenubar.showWindow();
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

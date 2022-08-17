import { Menu } from "electron";
import { Menubar, menubar } from "menubar";
import path from "path";
import logger from "../../shared/logger";

import { windowIndex } from "./environment";

let mainMenubar;

export function getMainMenubar(): Menubar {
  return mainMenubar;
}

export default function (): void {
  const icon = path.resolve(
    path.dirname(__dirname),
    "resources",
    "golden_gate.png"
  );

  logger.info("[Window] Icon: using icon from", icon);

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

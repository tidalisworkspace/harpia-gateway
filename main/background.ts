import { app } from "electron";
import serve from "electron-serve";
import logger from "../shared/logger";
import database from "./database";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import ipcMain from "./ipc-main";
import job from "./job";
import httpServer from "./http-server";
import socket from "./socket";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

logger.info(`app:main user data path ${app.getPath("userData")}`);

(async () => {
  await app.whenReady();
  await database.start();
  await ipcMain.start();
  await socket.start();
  await httpServer.start();
  job.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

import { app } from "electron";
import serve from "electron-serve";
import logger from "../shared/logger";
import database from "./database";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import httpServer from "./http-server";
import ipcMain from "./ipc-main";
import job from "./job";
import socketServer from "./socket-server";

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
  await socketServer.start();
  await httpServer.start();
  job.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

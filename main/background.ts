import { app } from "electron";
import serve from "electron-serve";
import path from "path";
import logger from "../shared/logger";
import database from "./database";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import http from "./http";
import ipc from "./ipc";
import job from "./job";
import socket from "./socket";

let directory

if (!isProd) {
  directory = path.resolve(app.getPath("home"), 'Harpia Gateway Files (development)')
}

if (isProd) {
  directory = path.resolve(app.getPath("home"), "Harpia Gateway Files")
  serve({ directory: "app" });
}

app.setPath("userData", directory)
logger.info(`app:main user data path ${app.getPath("userData")}`);

(async () => {
  await app.whenReady();
  await database.start();
  ipc.start();
  await socket.start();
  await http.start();
  job.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

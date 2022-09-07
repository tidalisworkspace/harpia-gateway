import { app } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import ipc from "./ipc";
import logger from "../shared/logger";
import socket from "./socket";
import server from './server'

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

logger.info("[APP] System: loading user data from", app.getPath("userData"));

(async () => {
  await app.whenReady();
  ipc.start();
  await socket.start();
  await server.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

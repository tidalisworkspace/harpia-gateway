import { app } from "electron";
import serve from "electron-serve";
import logger from "../shared/logger";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import ipc from "./ipc";
import job from "./job";
import server from "./server";
import socket from "./socket";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

logger.info(`app:main user data path ${app.getPath("userData")}`);

(async () => {
  await app.whenReady();
  ipc.start();
  await socket.start();
  await server.start();
  job.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

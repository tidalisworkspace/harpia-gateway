import { app } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { isProd } from "./helpers/environment";
import ipc from "./ipc";
import logger from "../shared/logger";
import socket from "./socket";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

logger.info("userdata>", app.getPath("userData"));

(async () => {
  await app.whenReady();
  ipc.start();
  await socket.start();
  createWindow();
})();

app.on("window-all-closed", () => {
  app.quit();
});

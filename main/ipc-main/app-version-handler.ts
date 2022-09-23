import { app, IpcMainEvent } from "electron";
import { IpcMainChannel, IpcRequest } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcHandler } from "./types";

export default class AppVersionHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "app_version";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      event.sender.send(request.responseChannel, {
        status: "success",
        data: app.getVersion(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

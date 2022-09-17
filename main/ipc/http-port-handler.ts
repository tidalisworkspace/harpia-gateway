import { IpcMainEvent } from "electron";
import { IpcMainChannel, IpcRequest } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import http from "../http";
import { IpcHandler } from "./types";

export default class HttpPortHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "http_port";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      event.sender.send(request.responseChannel, {
        status: "success",
        data: http.getPort(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

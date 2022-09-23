import { IpcMainEvent } from "electron";
import { IpcMainChannel, IpcRequest } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import socket from "../socket";
import { IpcHandler } from "./types";

export default class SocketStateHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "socket_state";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      event.sender.send(request.responseChannel, {
        status: "success",
        data: socket.getState(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

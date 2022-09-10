import { IpcMainEvent } from "electron";
import { IpcMainChannel, IpcRequest } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import storage from "../socket/connection/storage";
import { IpcHandler } from "./types";

export class SocketConnectionsAmountHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "socket_connections_amount";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      event.sender.send(request.responseChannel, {
        status: "success",
        data: storage.count(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.message}`, e);

      event.sender.send(request.responseChannel, {
        status: "error",
        data: 0,
      });
    }
  }
}

import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { DATABASE_CONNECTION_STATUS } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import database from "../database";
import { IpcHandler } from "./types";

export class DatabaseConnectionStatusHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_STATUS;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      await database.getConnection().authenticate();

      const response: IpcResponse = {
        status: "success",
        data: "connected",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        data: "disconnected",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

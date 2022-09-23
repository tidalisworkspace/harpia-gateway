import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import database from "../database";
import { IpcHandler } from "./types";

export class DatabaseConnectionStatusHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "database_connection_status";
  }

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
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        data: "disconnected",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

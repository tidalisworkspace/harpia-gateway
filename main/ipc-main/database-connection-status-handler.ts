import { IpcMainEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import database from "../database";
import { IpcHandler } from "./types";

export class DatabaseConnectionStatusHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "database_connection_status";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      await database.getConnection().authenticate();

      const response: IpcResponse = {
        status: "success",
        data: "connected",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        data: "disconnected",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

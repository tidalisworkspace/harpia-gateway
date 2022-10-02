import { IpcMainInvokeEvent } from "electron";
import { Sequelize } from "sequelize";
import { DATABASE_CONNECTION_TEST } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcHandler } from "./types";

export class DatabaseTestConnectionHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_TEST;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(
    event: Electron.IpcMainEvent,
    request: IpcRequest
  ): Promise<void> {
    try {
      const { host, port, username, password, dialect } = request.params;

      const sequelize = new Sequelize("cdav4", username, password, {
        host,
        port,
        dialect,
      });

      await sequelize.authenticate();

      const response: IpcResponse = {
        status: "success",
        message: "Conexão estabelecida",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível conectar",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

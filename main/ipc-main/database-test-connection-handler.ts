import { IpcMainInvokeEvent } from "electron";
import { Sequelize } from "sequelize";
import { DATABASE_CONNECTION_TEST } from "../../shared/constants/ipc-main-channels.constants";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcHandler } from "./types";

export class DatabaseTestConnectionHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_TEST;

  async handle(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    const { host, port, username, password, dialect } = request.params;

    const sequelize = new Sequelize("cdav4", username, password, {
      host,
      port,
      dialect,
    });

    try {
      await sequelize.authenticate();

      return {
        status: "success",
        message: "Conexão estabelecida",
      };
    } catch (e) {
      logger.error(`ipcMain:${this.channel} ${e.name}:${e.message}`);

      return {
        status: "error",
        message: "Impossível conectar",
      };
    }
  }
}

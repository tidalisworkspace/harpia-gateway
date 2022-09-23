import { Sequelize } from "sequelize";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcHandler } from "./types";

export class DatabaseTestConnectionHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "database_test_connection";
  }

  async handle(
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
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível conectar",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

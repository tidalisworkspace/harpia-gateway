import { IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import database from "../database";
import store from "../store";
import { IpcHandler } from "./types";

export class DatabaseUpdateConnectionHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "database_update_connection";
  }

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

      store.set("database", { host, port, dialect });
      store.setSecret("database.username", username);
      store.setSecret("database.password", password);

      database.start();

      const response: IpcResponse = {
        status: "success",
        message: "Dados de conexão atualizados",
      };

      event.sender.send(request.responseChannel, response);
      event.sender.send("settings_tab_dot", { ...response, data: "hide" });
      event.sender.send("database_connection_change", {
        ...response,
        data: "connected",
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível conectar",
      };

      event.sender.send(request.responseChannel, response);
      event.sender.send("settings_tab_dot", { ...response, data: "show" });
      event.sender.send("database_connection_change", {
        ...response,
        data: "disconnected",
      });
    }
  }
}

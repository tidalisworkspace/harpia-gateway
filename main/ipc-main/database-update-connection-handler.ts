import { IpcMainInvokeEvent } from "electron";
import { DATABASE_CONNECTION_UPDATE } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import database from "../database";
import store from "../store";
import { IpcHandler } from "./types";

export class DatabaseConnectionUpdateHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_UPDATE;

  async handle(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    const { host, port, username, password, dialect } = request.params;

    store.set("database", { host, port, dialect });
    store.setSecret("database.username", username);
    store.setSecret("database.password", password);

    try {
      await database.start();

      event.sender.send("settings_tab_dot", {
        status: "success",
        data: "hide",
      });

      event.sender.send("database_connection_change", {
        status: "success",
        data: "connected",
      });

      return {
        status: "success",
        message: "Dados de conexão atualizados",
      };
    } catch (e) {
      logger.error(`ipcMain:${this.channel} ${e.name}:${e.message}`);

      event.sender.send("settings_tab_dot", { status: "error", data: "show" });

      event.sender.send("database_connection_change", {
        status: "error",
        data: "disconnected",
      });

      return {
        status: "error",
        message: "Impossível conectar",
      };
    }
  }
}

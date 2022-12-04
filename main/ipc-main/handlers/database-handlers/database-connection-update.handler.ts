import { IpcMainInvokeEvent } from "electron";
import ipcMain from "../..";
import { DATABASE_CONNECTION_UPDATE } from "../../../../shared/constants/ipc-main-channels.constants";
import {
  DATABASE_CONNECTION_CHANGE,
  SETTINGS_TAB_DOT,
} from "../../../../shared/constants/ipc-renderer-channels.constants";
import { IpcRequest, IpcResponse } from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import database from "../../../database";
import store from "../../../store";
import { IpcHandler } from "../../types";

export class DatabaseConnectionUpdateHandler implements IpcHandler {
  channel = DATABASE_CONNECTION_UPDATE;

  async handle(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    const { host, port, username, password, dialect } = request.params;

    store.set("database", { host, port, dialect });
    store.setDatabaseUsername(username)
    store.setDatabasePassword(password)

    try {
      await database.start();

      ipcMain.sendToRenderer(SETTINGS_TAB_DOT, {
        status: "success",
        data: "hide",
      });

      ipcMain.sendToRenderer(DATABASE_CONNECTION_CHANGE, {
        status: "success",
        data: "connected",
      });

      return {
        status: "success",
        message: "Dados de conexão atualizados",
      };
    } catch (e) {
      logger.error(`ipc-main:${this.channel} ${e.name}:${e.message}`);

      ipcMain.sendToRenderer(SETTINGS_TAB_DOT, {
        status: "error",
        data: "show",
      });

      ipcMain.sendToRenderer(DATABASE_CONNECTION_CHANGE, {
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

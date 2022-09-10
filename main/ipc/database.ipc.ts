import { IpcMainEvent } from "electron";
import { Sequelize } from "sequelize";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import connection from "../database/connection";
import logger from "../../shared/logger";
import store from "../store";
import { IpcHandler } from "./types";

export class DatabaseConnectionStatusHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "database_connection_status";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      await connection.getSequelize().authenticate();

      const response: IpcResponse = {
        status: "success",
        data: "connected",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.message}`, e);

      const response: IpcResponse = {
        status: "error",
        data: "disconnected",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

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
      logger.error(`ipcMain:${this.getName()} error ${e.message}`, e);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível conectar",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

export class DatabaseUpdateConnectionHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "database_update_connection";
  }

  async handle(
    event: Electron.IpcMainEvent,
    request: IpcRequest
  ): Promise<void> {
    try {
      const { host, port, username, password, dialect } = request.params;

      store.set("database", { host, port, dialect });
      store.setSecret("database.username", username);
      store.setSecret("database.password", password);

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
      logger.error(`ipcMain:${this.getName()} error ${e.message}`, e);

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

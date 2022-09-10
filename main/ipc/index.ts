import { ipcMain } from "electron";
import { IpcRendererChannel, IpcResponse } from "../../shared/ipc/types";
import { getMainMenubar } from "../helpers/create-window";
import logger from "../../shared/logger";
import {
  DatabaseConnectionStatusHandler,
  DatabaseTestConnectionHandler,
  DatabaseUpdateConnectionHandler
} from "./database.ipc";
import { HardwareFindAllHandler } from "./hardware.ipc";
import { LoggerFileCleanHandle, LoggerFileOpenHandler, LoggerFileSizeHandler } from "./logger.ipc";
import { SocketConnectionsAmountHandler } from "./socket.ipc";
import { IpcHandler } from "./types";

class Ipc {
  private handlers: IpcHandler[];

  constructor(handlers: IpcHandler[]) {
    this.handlers = handlers;
  }

  start() {
    this.handlers.forEach((handler) => {
      ipcMain.on(handler.getName(), (event, request) =>
        handler.handle(event, request)
      );
    });
  }

  send(channel: IpcRendererChannel, response: IpcResponse): void {
    getMainMenubar()?.window?.webContents?.send(channel, response);
  }
}

const ipc = new Ipc([
  new LoggerFileOpenHandler(),
  new LoggerFileCleanHandle(),
  new LoggerFileSizeHandler(),
  new HardwareFindAllHandler(),
  new DatabaseConnectionStatusHandler(),
  new DatabaseTestConnectionHandler(),
  new DatabaseUpdateConnectionHandler(),
  new SocketConnectionsAmountHandler(),
]);

export default ipc;

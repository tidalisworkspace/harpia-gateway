import { ipcMain } from "electron";
import { IpcRendererChannel, IpcResponse } from "../../shared/ipc/types";
import { getMainMenubar } from "../helpers/create-window";
import {
  DatabaseConnectionStatusHandler,
  DatabaseTestConnectionHandler,
  DatabaseUpdateConnectionHandler,
} from "./database.ipc";
import HardwareConfigureEventsServerHandler from "./hardware-configure-events-server-handler";
import HardwareFindAllHandler from "./hardware-find-all-handler";
import HardwareRebootHandler from "./hardware-reboot-handler";
import HardwareUpdateDatetimeHandler from "./hardware-update-datetime-handler";
import HttpPortHandler from "./http-port-handler";
import { LoggerFileCleanHandle } from "./logger-file-clean-handle";
import { LoggerFileOpenHandler } from "./logger-file-open-handler.ipc";
import { LoggerFileSizeHandler } from "./logger-file-size-handler";
import SocketConnectionsAmountHandler from "./socket-connections-amount-handler";
import SocketPortHandler from "./socket-port-handler";

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
  new HardwareRebootHandler(),
  new HardwareUpdateDatetimeHandler(),
  new HardwareConfigureEventsServerHandler(),

  new DatabaseConnectionStatusHandler(),
  new DatabaseTestConnectionHandler(),
  new DatabaseUpdateConnectionHandler(),

  new SocketConnectionsAmountHandler(),
  new SocketPortHandler(),

  new HttpPortHandler(),
]);

export default ipc;

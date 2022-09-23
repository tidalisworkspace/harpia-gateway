import { ipcMain } from "electron";
import { IpcRendererChannel, IpcResponse } from "../../shared/ipc/types";
import { getMainMenubar } from "../helpers/create-window";

import { IpcHandler } from "./types";

export default class IpcMain {
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

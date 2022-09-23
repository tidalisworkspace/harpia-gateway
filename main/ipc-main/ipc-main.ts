import { ipcMain } from "electron";
import { IpcRendererChannel, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { getMainMenubar } from "../helpers/create-window";

import { IpcHandler } from "./types";

export default class IpcMain {
  private asyncHandlers: IpcHandler[];
  private syncHandlers: IpcHandler[];

  constructor(asyncHandlers: IpcHandler[], syncHandlers: IpcHandler[]) {
    this.asyncHandlers = asyncHandlers;
    this.syncHandlers = syncHandlers;
  }

  private addAsyncHandler(handler: IpcHandler) {
    ipcMain.on(handler.getChannel(), (event, input) =>
      handler.handleAsync(event, input)
    );
  }

  private addSyncHandler(handler: IpcHandler) {
    ipcMain.handle(handler.getChannel(), async (event, input) => {
      const output = await handler.handleSync(event, input);
      return output;
    });
  }

  start() {
    const totalAsync = this.asyncHandlers.length;
    const totalSync = this.syncHandlers.length;
    const message = `${totalAsync} async and ${totalSync} sync handlers`;

    logger.info(`ipcMain:start starting ${message}`);

    this.asyncHandlers.forEach(this.addAsyncHandler);
    this.syncHandlers.forEach(this.addSyncHandler);
  }

  sendToRenderer(channel: IpcRendererChannel, response: IpcResponse): void {
    getMainMenubar()?.window?.webContents?.send(channel, response);
  }
}

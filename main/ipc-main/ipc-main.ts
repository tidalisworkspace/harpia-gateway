import { ipcMain, IpcMainInvokeEvent } from "electron";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { getMainMenubar } from "../helpers/create-window";

import { IpcHandler } from "./types";

export default class IpcMain {
  private handlers: IpcHandler[];

  constructor(handlers: IpcHandler[]) {
    this.handlers = handlers;
  }

  private async handleWrapper(
    event: IpcMainInvokeEvent,
    request: IpcRequest,
    handler: IpcHandler
  ): Promise<IpcResponse> {
    try {
      const response = await handler.handle(event, request);
      return response;
    } catch (e) {
      logger.error(`ipcMain:${handler.channel} ${e.name}:${e.message}`);

      return {
        status: "error",
        message: "Erro inesperado",
      };
    }
  }

  private addHandler(handler: IpcHandler) {
    ipcMain.handle(handler.channel, (event, input) =>
      this.handleWrapper(event, input, handler)
    );
  }

  async start(): Promise<void> {
    logger.info(`ipcMain:start starting ${this.handlers.length} handlers`);

    for (const handler of this.handlers) {
      this.addHandler(handler);
    }

    return;
  }

  sendToRenderer(channel: string, response: IpcResponse): void {
    getMainMenubar()?.window?.webContents?.send(channel, response);
  }
}

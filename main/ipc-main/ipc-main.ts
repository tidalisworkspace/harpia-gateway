import { message } from "antd";
import { ipcMain, IpcMainInvokeEvent } from "electron";
import { IpcMessage, IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { getMainMenubar } from "../helpers/create-window";

import { IpcMainHandler } from "./types";

const handlerNotFoundError: IpcResponse = {
  status: "error",
  message: "Não foi possível executar",
};

const unexpectedError: IpcResponse = {
  status: "error",
  message: "Erro inesperado",
};

export default class IpcMain {
  private handlers: IpcMainHandler[];

  constructor(handlers: IpcMainHandler[]) {
    this.handlers = handlers;
  }

  private async handleWrapper(
    event: IpcMainInvokeEvent,
    request: IpcRequest,
    handler: IpcMainHandler
  ): Promise<IpcResponse> {
    try {
      const response = await handler.handle(event, request);
      return response;
    } catch (e) {
      logger.error(
        `ipc-main:handle-wrapper:${handler.channel} ${e.name}:${e.message}`
      );

      return unexpectedError;
    }
  }

  private handlerByChannel(
    channel: string
  ): (handler: IpcMainHandler) => boolean {
    return (handler: IpcMainHandler) => channel === handler.channel;
  }

  private async resolveRequest(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    const handler = this.handlers.find(this.handlerByChannel(request.channel));

    if (!handler) {
      return handlerNotFoundError;
    }

    return this.handleWrapper(event, request, handler);
  }

  async start(): Promise<void> {
    logger.info(`ipc-main:start ${this.handlers.length} handlers`);

    ipcMain.handle("main", (event: IpcMainInvokeEvent, request: IpcRequest) =>
      this.resolveRequest(event, request)
    );

    return;
  }

  send(channel: string, data: any): void {
    const message: IpcMessage = {
      channel,
      data,
    };

    getMainMenubar()?.window?.webContents?.send("renderer", message);
  }
}

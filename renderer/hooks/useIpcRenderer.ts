import electron from "electron";
import { IpcMessage, IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcRendererHandle, IpcRendererHandler } from "../types";

const requestError: IpcResponse = {
  status: "error",
  message: "Não foi possível enviar comando",
};

export class IpcRenderer {
  private handlers: IpcRendererHandler[] = [];

  async request(request: IpcRequest): Promise<IpcResponse> {
    const channel = request.channel;

    try {
      const response = await electron.ipcRenderer.invoke("main", request);
      return response;
    } catch (e) {
      logger.error(`ipcRenderer:request:${channel} ${e.name}:${e.message}`);
      return requestError;
    }
  }

  private handlerByChannel(
    channel: string
  ): (handler: IpcRendererHandler) => boolean {
    return (handler: IpcRendererHandler) => channel === handler.channel;
  }

  private handle(message: IpcMessage) {
    const handler = this.handlers.find(this.handlerByChannel(message.channel));

    if (!handler) {
      logger.error("ipc-renderer:handle handler not found");
      return;
    }

    handler.handle(message);
  }

  private refreshHandlers() {
    electron.ipcRenderer?.removeAllListeners("renderer");

    electron.ipcRenderer?.on("renderer", (event, message: IpcMessage) =>
      this.handle(message)
    );
  }

  addHandler(channel: string, handle: IpcRendererHandle): void {
    const handler: IpcRendererHandler = {
      channel,
      handle,
    };

    this.handlers.push(handler);

    this.refreshHandlers();
  }
}

const ipcRenderer = new IpcRenderer();

export function useIpcRenderer(): IpcRenderer {
  return ipcRenderer;
}

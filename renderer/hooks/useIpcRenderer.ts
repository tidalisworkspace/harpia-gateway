import electron from "electron";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcRendererListener } from "../types";

export class IpcRenderer {
  async request(channel: string, input?: IpcRequest): Promise<IpcResponse> {
    try {
      const response = await electron.ipcRenderer.invoke(channel, input);
      return response;
    } catch (e) {
      logger.error(`ipcRenderer:request:${channel} ${e.name}:${e.message}`);
      return { status: "error" };
    }
  }

  listen(channel: string, listener: IpcRendererListener): void {
    electron.ipcRenderer?.removeAllListeners(channel);

    electron.ipcRenderer?.on(channel, (event, args) => {
      listener(args);
    });
  }
}

const ipcRenderer = new IpcRenderer();

export function useIpcRenderer(): IpcRenderer {
  return ipcRenderer;
}

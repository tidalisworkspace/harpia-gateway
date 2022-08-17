import electron from "electron";
import {
  IpcMainChannel,
  IpcRendererChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";

export class Ipc {
  send(channel: IpcMainChannel, request?: IpcRequest): Promise<IpcResponse> {
    if (!request) {
      request = {
        responseChannel: `${channel}_response_${new Date().getTime()}`,
      };
    }

    if (!request.responseChannel) {
      request.responseChannel = `${channel}_response_${new Date().getTime()}`;
    }

    logger.info("[IPC Renderer] Request:", channel);

    electron.ipcRenderer.send(channel, request);

    return new Promise((resolve) => {
      electron.ipcRenderer.once(
        request.responseChannel,
        (event, response: IpcResponse) => {
          logger.info(
            "[IPC Renderer] Response:",
            channel,
            response.status,
            response.message || ""
          );

          resolve(response);
        }
      );
    });
  }

  listen(channel: IpcRendererChannel, listener: any): void {
    logger.info("[IPC Renderer] Listening:", channel);

    electron.ipcRenderer?.on(channel, (event, args) => {
      logger.info("[IPC Renderer] Listen:", args);
      listener(args);
    });
  }
}

const ipc = new Ipc();

export function useIpc(): Ipc {
  return ipc;
}

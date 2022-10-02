import electron from "electron";
import {
  IpcMainChannel,
  IpcRendererChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";

export class Ipc {
  send(channel: string, request?: IpcRequest): Promise<IpcResponse> {
    if (!request) {
      request = {
        responseChannel: `${channel}_response_${new Date().getTime()}`,
      };
    }

    if (!request.responseChannel) {
      request.responseChannel = `${channel}_response_${new Date().getTime()}`;
    }

    electron.ipcRenderer.send(channel, request);

    return new Promise((resolve) => {
      electron.ipcRenderer.once(
        request.responseChannel,
        (event, response: IpcResponse) => {
          resolve(response);
        }
      );
    });
  }

  request(
    channel: string,
    input: IpcRequest = null
  ): Promise<IpcResponse> {
    return electron.ipcRenderer.invoke(channel, input);
  }

  listen(channel: IpcRendererChannel, listener: any): void {
    electron.ipcRenderer?.on(channel, (event, args) => {
      listener(args);
    });
  }
}

const ipc = new Ipc();

export function useIpc(): Ipc {
  return ipc;
}

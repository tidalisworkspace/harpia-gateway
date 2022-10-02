import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { SOCKET_STATE } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import socket from "../socket";
import { IpcHandler } from "./types";

export default class SocketStateHandler implements IpcHandler {
  channel = SOCKET_STATE;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      event.sender.send(request.responseChannel, {
        status: "success",
        data: socket.getState(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

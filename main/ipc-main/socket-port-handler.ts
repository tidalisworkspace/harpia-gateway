import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import socket from "../socket";
import { IpcHandler } from "./types";

export default class SocketPortHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "socket_port";
  }

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
        data: socket.getPort(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

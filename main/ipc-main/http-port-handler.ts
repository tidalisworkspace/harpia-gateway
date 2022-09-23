import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import http from "../http";
import { IpcHandler } from "./types";

export default class HttpPortHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "http_port";
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
        data: http.getPort(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
      });
    }
  }
}

import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { SOCKET_CONNECTIONS_AMOUNT } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import storage from "../socket/connection/storage";
import { IpcHandler } from "./types";

export default class SocketConnectionsAmountHandler implements IpcHandler {
  channel = SOCKET_CONNECTIONS_AMOUNT;

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
        data: storage.count(),
      });
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      event.sender.send(request.responseChannel, {
        status: "error",
        data: 0,
      });
    }
  }
}

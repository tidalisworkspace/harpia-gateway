import { IpcMainEvent, IpcMainInvokeEvent, shell } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { IpcHandler } from "./types";

export class LoggerFileOpenHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "logger_file_open";
  }

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      const message = await shell.openPath(
        logger.transports.file.getFile().path
      );

      if (!message) {
        event.sender.send(request.responseChannel, { status: "success" });
      }

      if (message) {
        logger.error(`ipcMain:${this.getChannel()} error ${message}`);

        const response: IpcResponse = {
          status: "error",
          message: "Impossível abrir os logs",
        };

        event.sender.send(request.responseChannel, response);
      }
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível abrir os logs",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

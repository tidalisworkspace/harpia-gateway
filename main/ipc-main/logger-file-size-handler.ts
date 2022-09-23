import { IpcMainEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import formatFileSize from "../helpers/format-file-size";
import { IpcHandler } from "./types";

export class LoggerFileSizeHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "logger_file_size";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      const logFileSize = logger.transports.file.getFile().size;
      const data = formatFileSize(logFileSize);

      const response: IpcResponse = {
        status: "success",
        data,
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível obter tamanho do log",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

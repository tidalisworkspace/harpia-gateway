import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { LOGGER_FILE_SIZE } from "../../shared/constants/ipc-main-channels";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import formatFileSize from "../helpers/format-file-size";
import { IpcHandler } from "./types";

export class LoggerFileSizeHandler implements IpcHandler {
  channel = LOGGER_FILE_SIZE;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      const logFileSize = logger.transports.file.getFile().size;
      const data = formatFileSize(logFileSize);

      const response: IpcResponse = {
        status: "success",
        data,
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível obter tamanho do log",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

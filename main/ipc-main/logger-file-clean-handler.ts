import { IpcMainInvokeEvent } from "electron";
import { LOGGER_FILE_CLEAN } from "../../shared/constants/ipc-main-channels";
import {
  IpcRequest,
  IpcResponse,
  IpcResponseStatus,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import formatFileSize from "../helpers/format-file-size";
import { IpcHandler } from "./types";

export class LoggerFileCleanHandler implements IpcHandler {
  channel = LOGGER_FILE_CLEAN;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(
    event: Electron.IpcMainEvent,
    request: IpcRequest
  ): Promise<void> {
    try {
      const clean = logger.transports.file.getFile().clear();
      const logFileSize = logger.transports.file.getFile().size;

      const status: IpcResponseStatus = clean ? "success" : "error";
      const data = formatFileSize(logFileSize);

      const response: IpcResponse = {
        status,
        message: "Arquivo de log limpo",
        data,
      };

      event.sender.send(request.responseChannel, response);
      event.sender.send("logger_file_size_change", response);
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível limpar os logs",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

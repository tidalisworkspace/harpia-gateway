import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
  IpcResponseStatus,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import formatFileSize from "../helpers/format-file-size";
import { IpcHandler } from "./types";

export class LoggerFileCleanHandle implements IpcHandler {
  getName(): IpcMainChannel {
    return "logger_file_clean";
  }

  async handle(
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
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível limpar os logs",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

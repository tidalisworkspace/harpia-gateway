import { IpcMainEvent, shell } from "electron";
import ipc from ".";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { getMainMenubar } from "../helpers/create-window";
import { IpcHandler } from "./types";

function getFileSize(): string {
  const bytes = logger.transports.file.getFile().size;

  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + " " + sizes[i];
}

export class LoggerFileOpenHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "logger_file_open";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      const message = await shell.openPath(
        logger.transports.file.getFile().path
      );

      if (!message) {
        event.sender.send(request.responseChannel, { status: "success" });
      }

      if (message) {
        logger.error(message);

        const response: IpcResponse = {
          status: "error",
          message: "Impossível abrir os logs",
        };

        event.sender.send(request.responseChannel, response);
      }
    } catch (e) {
      logger.error("LoggerOpenFileHandler error>", e.message);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível abrir os logs",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

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

      const response: IpcResponse = {
        status: clean ? "success" : "error",
        message: "Log limpo",
        data: getFileSize()
      };

      event.sender.send(request.responseChannel, response);
      event.sender.send("logger_file_size_change", response)
    } catch (e) {
      logger.error("LoggerCleanFileHandle error> ", e.message);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível limpar os logs",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

export class LoggerFileSizeHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "logger_file_size";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    try {
      const response: IpcResponse = {
        status: "success",
        data: getFileSize(),
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error("LoggerFileSizeHandler error>", e.message);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível obter tamanho do log",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

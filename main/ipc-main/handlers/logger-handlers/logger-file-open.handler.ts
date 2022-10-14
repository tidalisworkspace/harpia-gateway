import { shell } from "electron";
import { LOGGER_FILE_OPEN } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import { IpcHandler } from "../../types";

export class LoggerFileOpenHandler implements IpcHandler {
  channel = LOGGER_FILE_OPEN;

  async handle(): Promise<IpcResponse> {
    const message = await shell.openPath(logger.transports.file.getFile().path);

    if (message) {
      logger.error(`ipc-main:${this.channel} ${message}`);

      return {
        status: "error",
        message: "Impossível abrir os logs",
      };
    }

    return { status: "success", message: "Arquivo de logs aberto" };
  }
}

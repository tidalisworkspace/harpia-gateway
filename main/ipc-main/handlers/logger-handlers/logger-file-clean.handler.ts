import { LOGGER_FILE_CLEAN } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse, IpcResponseStatus } from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import formatFileSize from "../../../helpers/format-file-size";
import { IpcMainHandler } from "../../types";

export class LoggerFileCleanHandler implements IpcMainHandler {
  channel = LOGGER_FILE_CLEAN;

  async handle(): Promise<IpcResponse> {
    const clean = logger.transports.file.getFile().clear();
    const logFileSize = logger.transports.file.getFile().size;

    const status: IpcResponseStatus = clean ? "success" : "error";
    const data = formatFileSize(logFileSize);

    return {
      status,
      message: "Arquivo de log limpo",
      data,
    };
  }
}

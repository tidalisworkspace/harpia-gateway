import { LOGGER_FILE_SIZE } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import formatFileSize from "../../../helpers/format-file-size";
import { IpcMainHandler } from "../../types";

export class LoggerFileSizeHandler implements IpcMainHandler {
  channel = LOGGER_FILE_SIZE;

  async handle(): Promise<IpcResponse> {
    const logFileSize = logger.transports.file.getFile().size;
    const data = formatFileSize(logFileSize);

    return {
      status: "success",
      message: "Informações atualizadas",
      data,
    };
  }
}

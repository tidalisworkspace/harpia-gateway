import { Socket } from "net";
import { IpcResponse } from "../../../shared/ipc/types";
import ipcMain from "../../ipc";
import logger from "../../../shared/logger";
import { Handler } from "./handler";
import storage from "./storage";

const handler = new Handler();

function handleError(connectionId: string, error: Error) {
  storage.remove(connectionId);
  logger.error(`[Socket] Connection [${connectionId}]: error ${error.message}`);
}

function handleClose(connectionId: string) {
  storage.remove(connectionId);

  const response: IpcResponse = {
    status: "success",
    data: storage.count(),
  };

  ipcMain.send("socket_connections_change", response);

  logger.info(`[Socket] Connection [${connectionId}]: closed`);
}

function handleData(connectionId: string, data: Buffer) {
  logger.info(
    `[Socket] Connection [${connectionId}]: received data with ${data.length} length`
  );

  const message = data
    .toString("utf-8")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, '"');

  try {
    const json = JSON.parse(message);

    handler.resolve(connectionId, json);
  } catch (e) {
    logger.info(
      `[Socket] Connection [${connectionId}]: error (when trying parse and resolve) ${e.message}`
    );
  }
}

export function handleConnection(connection: Socket) {
  const connectionId = storage.add(connection);

  connection.on("error", (error: Error) => handleError(connectionId, error));
  connection.on("close", () => handleClose(connectionId));
  connection.on("data", (data) => handleData(connectionId, data));

  const response: IpcResponse = {
    status: "success",
    data: storage.count(),
  };

  ipcMain.send("socket_connections_change", response);

  logger.info(`[Socket] Connection [${connectionId}]: connected`);
}

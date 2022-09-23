import { Socket } from "net";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import ipcMain from "../../ipc-main";
import { Handler } from "./handler";
import storage from "./storage";
import validator, { socketMessageSchema } from "./validator";

const handler = new Handler();

function handleError(connectionId: string, e: Error) {
  const connection = storage.get(connectionId);

  connection.destroy();

  logger.error(
    `socket:connection:${connectionId} error ${e.name}:${e.message}`
  );
}

function handleClose(connectionId: string) {
  storage.remove(connectionId);

  const response: IpcResponse = {
    status: "success",
    data: storage.count(),
  };

  ipcMain.sendToRenderer("socket_connections_change", response);

  logger.info(`socket:connection:${connectionId} closed`);
}

function handleData(connectionId: string, data: Buffer) {
  const message = data
    .toString("utf-8")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, '"');

  const json = JSON.parse(message);

  const result = validator.validate(json, socketMessageSchema);

  if (!result.valid) {
    logger.warn(`socket:connection:${connectionId} invalid json schema`);
    return;
  }

  handler.resolve(connectionId, json);
}

export function handleConnection(connection: Socket) {
  const connectionId = storage.add(connection);

  connection.on("error", (e: Error) => handleError(connectionId, e));
  connection.on("close", () => handleClose(connectionId));
  connection.on("data", (data) => handleData(connectionId, data));

  const response: IpcResponse = {
    status: "success",
    data: storage.count(),
  };

  ipcMain.sendToRenderer("socket_connections_change", response);

  logger.info(`socket:connection:${connectionId} connected`);
}

import { Socket } from "net";
import { SOCKET_CONNECTIONS_CHANGE } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import ipcMain from "../../ipc-main";
import HandlerManager from "../handlers/handler-manager";
import storage from "./storage";
import validator, { socketMessageSchema } from "./validator";

export default class ConnectionManager {
  private handlerManager: HandlerManager;

  constructor(handlerManager: HandlerManager) {
    this.handlerManager = handlerManager;
  }

  handleError(connectionId: string, e: Error) {
    logger.error(
      `socket:connection-manager:${connectionId} ${e.name}:${e.message}`
    );

    const item = storage.get(connectionId);

    item.connection.destroy();
  }

  handleClose(connectionId: string) {
    logger.info(`socket:connection-manager:${connectionId} closed`);

    storage.remove(connectionId);

    const response: IpcResponse = {
      status: "success",
      data: {
        connectionsAmount: storage.count("unknow"),
        camerasAmount: storage.count("camera"),
      },
    };

    ipcMain.sendToRenderer(SOCKET_CONNECTIONS_CHANGE, response);
  }

  private toMessage(data: Buffer) {
    return data.toString("utf-8").replace(/\\/g, "\\\\").replace(/'/g, '"');
  }

  private isValid(connectionId: string, message: string): boolean {
    let json;

    try {
      json = JSON.parse(message);
    } catch (e) {
      logger.warn(`socket:connection-manager:${connectionId} unparseable json`);
      return false;
    }

    const result = validator.validate(json, socketMessageSchema);

    if (!result.valid) {
      logger.warn(`socket:connection-manager:${connectionId} invalid schema`);
    }

    return result.valid;
  }

  handleData(connectionId: string, data: Buffer) {
    const message = this.toMessage(data);

    const valid = this.isValid(connectionId, message);

    if (!valid) {
      return;
    }

    this.handlerManager.resolve(connectionId, JSON.parse(message));
  }

  handleCameraData(connectionId: string, data: Buffer) {
    // TODO add logic to read data and deal with it
    logger.debug(`socket:camera:${connectionId} received ${data.toString("hex")}`);
  }

  private async isCamera(connection: Socket): Promise<boolean> {
    const ip = connection.remoteAddress;

    if (!ip) {
      return false;
    }

    const equipamento = await equipamentoModel().findOne({
      attributes: ["id"],
      where: { ip },
    });

    if (!equipamento || equipamento.modelo !== "LPR ALPHA1") {
      return false;
    }

    return true;
  }

  async handleConnection(connection: Socket) {
    const isCamera = await this.isCamera(connection);
    const connectionType = isCamera ? "camera" : "unknow";

    const connectionId = storage.add(connection, connectionType);
    const useDataHandler = isCamera ? this.handleCameraData : this.handleData;

    connection.on("error", (e: Error) => this.handleError(connectionId, e));
    connection.on("close", () => this.handleClose(connectionId));
    connection.on("data", (data) => useDataHandler(connectionId, data));

    const response: IpcResponse = {
      status: "success",
      data: {
        connectionsAmount: storage.count("unknow"),
        camerasAmount: storage.count("camera"),
      },
    };

    ipcMain.sendToRenderer(SOCKET_CONNECTIONS_CHANGE, response);

    const message = isCamera ? "camera connected" : "connected";
    logger.info(`socket:connection-manager:${connectionId} ${message}`);
  }
}

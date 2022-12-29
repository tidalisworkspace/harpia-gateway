import { Socket } from "net";
import { SOCKET_CONNECTIONS_CHANGE } from "../../../shared/constants/ipc-renderer-channels.constants";
import { IpcResponse } from "../../../shared/ipc/types";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import ipcMain from "../../ipc-main";
import CameraHandlerManager from "../camera-handlers/camera-handler-manager";
import HandlerManager from "../handlers/handler-manager";
import storage from "./storage";
import validator, { socketMessageSchema } from "./validator";

export default class ConnectionManager {
  private handlerManager: HandlerManager;
  private cameraHandlerManager: CameraHandlerManager;

  constructor(
    handlerManager: HandlerManager,
    cameraHandlerManager: CameraHandlerManager
  ) {
    this.handlerManager = handlerManager;
    this.cameraHandlerManager = cameraHandlerManager;
  }

  handleError(id: string, e: Error) {
    logger.error(`socket:connection-manager:${id} ${e.name}:${e.message}`);

    const item = storage.get(id);

    item.connection.destroy();
  }

  handleClose(id: string) {
    logger.info(`socket:connection-manager:${id} closed`);

    storage.remove(id);

    const data = {
      connectionsAmount: storage.count("cda"),
      camerasAmount: storage.count("camera"),
    };

    ipcMain.send(SOCKET_CONNECTIONS_CHANGE, data);
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
    this.cameraHandlerManager.resolve(connectionId, data);
  }

  private async isCamera(connection: Socket): Promise<boolean> {
    const ip = connection.remoteAddress;

    if (!ip) {
      return false;
    }

    const equipamento = await equipamentoModel().findOne({
      attributes: ["id", "modelo"],
      where: { ip },
    });

    if (!equipamento || equipamento.modelo !== "LPR ALPHA1") {
      return false;
    }

    return true;
  }

  private addDataHandler(id: string, connection: Socket, type: string) {
    if (type === "camera") {
      connection.on("data", (data) => this.handleCameraData(id, data));
      return;
    }

    connection.on("data", (data) => this.handleData(id, data));
  }

  async handleConnection(connection: Socket) {
    const isCamera = await this.isCamera(connection);
    const type = isCamera ? "camera" : "cda";

    const id = storage.add(connection, type);

    connection.on("error", (e: Error) => this.handleError(id, e));
    connection.on("close", () => this.handleClose(id));
    this.addDataHandler(id, connection, type);

    const data = {
      connectionsAmount: storage.count("cda"),
      camerasAmount: storage.count("camera"),
    };

    ipcMain.send(SOCKET_CONNECTIONS_CHANGE, data);

    const message = isCamera ? "camera connected" : "connected";
    logger.info(`socket:connection-manager:${id} ${message}`);
  }
}

import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { HARDWARE_CONNECTION_TEST } from "../../shared/constants/ipc-main-channels";
import {
  HardwareCommandIpcRequest,
  IpcRequest,
  IpcResponse
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { deviceClients } from "../device-clients";
import store from "../store";
import { IpcHandler } from "./types";

export default class HardwareTestConnection implements IpcHandler {
  channel = HARDWARE_CONNECTION_TEST;

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  async handleAsync(
    event: IpcMainEvent,
    request: HardwareCommandIpcRequest
  ): Promise<void> {
    try {
      const errors = [];

      for (const deviceAddress of request.params) {
        const { ip, port } = deviceAddress;

        const deviceClient = await deviceClients.get(ip, port);

        if (!deviceClient) {
          logger.error(
            `ipcMain:${this.channel} device client not found by ip ${ip}`
          );

          errors.push(ip);

          continue;
        }

        try {
          const connection = await deviceClient.testConnection();

          store.setHardwareConnection(ip, connection);

          continue;
        } catch (e) {
          logger.error(`ipcMain:${this.channel} ${ip} ${e.name}:${e.message}`);

          errors.push(ip);

          continue;
        }
      }

      if (errors.length) {
        const error = errors.join(",");

        const response: IpcResponse = {
          status: "error",
          message: `Erro para testar conexão: ${error}`,
        };

        event.sender.send(request.responseChannel, response);

        return;
      }

      const response: IpcResponse = {
        status: "success",
        message: "Conexão testada",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível testar conexão",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

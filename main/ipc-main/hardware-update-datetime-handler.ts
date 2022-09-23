import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  HardwareCommandIpcRequest,
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { deviceClients } from "../device-clients";
import { IpcHandler } from "./types";

export default class HardwareUpdateDatetimeHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "hardware_update_datetime";
  }

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
            `ipcMain:${this.getChannel()} device client not found by ip ${ip}`
          );

          errors.push(ip);

          continue;
        }

        try {
          await deviceClient.updateTime();
        } catch (e) {
          logger.error(
            `ipcMain:${this.getChannel()} error ${ip} ${e.name}:${e.message}`
          );

          errors.push(ip);

          continue;
        }
      }

      if (errors.length) {
        const error = errors.join(",");

        const response: IpcResponse = {
          status: "error",
          message: `Erro para atualizar data/hora: ${error}`,
        };

        event.sender.send(request.responseChannel, response);

        return;
      }

      const response: IpcResponse = {
        status: "success",
        message: "Data/hora atualizada",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível atualizar data/hora",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

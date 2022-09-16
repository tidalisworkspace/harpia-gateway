import { IpcMainEvent } from "electron";
import {
  HardwareCommandIpcRequest,
  IpcMainChannel,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { deviceClients } from "../device-clients";
import { IpcHandler } from "./types";

export default class HardwareConfigureEventsServerHandler
  implements IpcHandler
{
  getName(): IpcMainChannel {
    return "hardware_configure_events_server";
  }

  async handle(
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
            `ipcMain:${this.getName()} device client not found by ip ${ip}`
          );

          errors.push(ip);

          continue;
        }

        try {
          await deviceClient.updateTime();
        } catch (e) {
          logger.error(
            `ipcMain:${this.getName()} error ${ip} ${e.name}:${e.message}`
          );

          errors.push(ip);

          continue;
        }
      }

      if (errors.length) {
        const error = errors.join(",");

        const response: IpcResponse = {
          status: "error",
          message: `Erro para configurar servidor de eventos: ${error}`,
        };

        event.sender.send(request.responseChannel, response);

        return;
      }

      const response: IpcResponse = {
        status: "success",
        message: "Servidor de eventos configurado",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível configurar servidor de eventos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

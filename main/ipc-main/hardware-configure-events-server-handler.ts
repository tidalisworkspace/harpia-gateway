import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { HARDWARE_EVENTS_SERVER_UPDATE } from "../../shared/constants/ipc-main-channels";
import {
  HardwareCommandIpcRequest,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import { deviceClients } from "../device-clients";
import http from "../http";
import { IpcHandler } from "./types";

export default class HardwareEventsServerUpdateHandler implements IpcHandler {
  channel = HARDWARE_EVENTS_SERVER_UPDATE;

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
          const ip = http.getIp();
          const port = http.getPort();

          await deviceClient.setEventsServer({ ip, port });
        } catch (e) {
          logger.error(
            `ipcMain:${this.channel} error ${ip} ${e.name}:${e.message}`
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
      logger.error(`ipcMain:${this.channel} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível configurar servidor de eventos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

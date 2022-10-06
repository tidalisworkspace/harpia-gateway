import { IpcMainInvokeEvent } from "electron";
import { HARDWARE_EVENTS_SERVER_UPDATE } from "../../../../shared/constants/ipc-main-channels.constants";
import {
  HardwareCommandIpcRequest,
  IpcResponse,
} from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import httpServer from "../../../http-server";
import { IpcHandler } from "../../types";

export default class HardwareEventsServerUpdateHandler implements IpcHandler {
  channel = HARDWARE_EVENTS_SERVER_UPDATE;

  async handle(
    event: IpcMainInvokeEvent,
    request: HardwareCommandIpcRequest
  ): Promise<IpcResponse> {
    const errors = [];

    for (const deviceAddress of request.params) {
      const { ip, port } = deviceAddress;

      const deviceClient = await deviceClients.get(ip, port);

      if (!deviceClient) {
        errors.push(ip);

        continue;
      }

      const eventsServerIp = httpServer.getIp();
      const eventsServerPort = httpServer.getPort();

      try {
        await deviceClient.setEventsServer({
          ip: eventsServerIp,
          port: eventsServerPort,
        });
      } catch (e) {
        logger.error(`ipc-main:${this.channel}:${ip} ${e.name}:${e.message}`);

        errors.push(ip);

        continue;
      }
    }

    if (errors.length) {
      const error = errors.join(",");

      return {
        status: "error",
        message: `Erro para configurar servidor de eventos: ${error}`,
      };
    }

    return {
      status: "success",
      message: "Servidor de eventos configurado",
    };
  }
}

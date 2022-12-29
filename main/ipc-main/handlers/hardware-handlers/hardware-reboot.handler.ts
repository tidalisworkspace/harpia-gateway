import { IpcMainInvokeEvent } from "electron";
import { HARDWARE_REBOOT } from "../../../../shared/constants/ipc-main-channels.constants";
import {
  HardwareCommandIpcRequest,
  IpcResponse,
} from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { IpcMainHandler } from "../../types";

export default class HardwareRebootHandler implements IpcMainHandler {
  channel = HARDWARE_REBOOT;

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

      try {
        await deviceClient.reboot();
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
        message: `Erro para reiniciar: ${error}`,
      };
    }

    return {
      status: "success",
      message: "Reinicialização solicitada",
    };
  }
}

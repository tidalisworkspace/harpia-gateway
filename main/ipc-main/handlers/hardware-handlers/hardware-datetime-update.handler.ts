import { IpcMainInvokeEvent } from "electron";
import { HARDWARE_DATETIME_UPDATE } from "../../../../shared/constants/ipc-main-channels.constants";
import { HardwareCommandIpcRequest, IpcResponse } from "../../../../shared/ipc/types";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { IpcHandler } from "../../types";

export default class HardwareDatetimeUpdateHandler implements IpcHandler {
  channel = HARDWARE_DATETIME_UPDATE;

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
        await deviceClient.updateTime();
      } catch (e) {
        logger.error(`ipcMain:${this.channel} ${ip} ${e.name}:${e.message}`);

        errors.push(ip);

        continue;
      }
    }

    if (errors.length) {
      const error = errors.join(",");

      return {
        status: "error",
        message: `Erro para atualizar data/hora: ${error}`,
      };
    }

    return {
      status: "success",
      message: "Data/hora atualizada",
    };
  }
}

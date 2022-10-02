import { IpcMainInvokeEvent } from "electron";
import { HARDWARE_CONNECTION_TEST } from "../../../../shared/constants/ipc-main-channels.constants";
import {
  HardwareCommandIpcRequest,
  IpcResponse,
} from "../../../../shared/ipc/types";
import { deviceClients } from "../../../device-clients";
import store from "../../../store";
import { IpcHandler } from "../../types";

export default class HardwareConnectionTestHandler implements IpcHandler {
  channel = HARDWARE_CONNECTION_TEST;

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

      const connection = await deviceClient.testConnection();

      store.setHardwareConnection(ip, connection);
    }

    if (errors.length) {
      const error = errors.join(",");

      return {
        status: "error",
        message: `Erro para testar conexão: ${error}`,
      };
    }

    return {
      status: "success",
      message: "Conexão testada",
    };
  }
}

import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import equipamentoModel, {
  Equipamento,
} from "../database/models/equipamento.model";
import store from "../store";
import { IpcHandler } from "./types";

export default class HardwareFindAllHandler implements IpcHandler {
  getChannel(): IpcMainChannel {
    return "hardware_find_all";
  }

  async handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse> {
    return null;
  }

  private toHardware(equipamento: Equipamento) {
    const connection = store.getHardwareConnection(equipamento.ip);

    return {
      key: equipamento.id,
      name: `${equipamento.id} ${equipamento.nome}`,
      ip: equipamento.ip,
      port: equipamento.porta,
      manufacturer: equipamento.fabricante,
      connection,
    };
  }

  async handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    const attributes = ["id", "nome", "ip", "porta", "fabricante"];

    try {
      const equipamentos = await equipamentoModel().findAll({ attributes });

      const hardwares = equipamentos.map(this.toHardware);

      const response: IpcResponse = {
        status: "success",
        message: "Dispositivos obtidos",
        data: hardwares,
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getChannel()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível buscar dispositivos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

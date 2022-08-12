import { IpcMainEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse
} from "../../shared/ipc/types";
import equipamentoModel, { Equipamento } from "../database/models/equipamento.model";
import logger from "../../shared/logger";

import { IpcHandler } from "./types";

function toHardware(equipamento: Equipamento) {
  return {
    id: `${equipamento.id} ${equipamento.nome}`,
    ip: `${equipamento.ip}:${equipamento.porta}`,
    manufacturer: equipamento.fabricante,
  };
}

export class HardwareFindAllHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "hardware_find_all";
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    const attributes = ["id", "nome", "ip", "porta", "fabricante"];

    try {
      const equipamentos = await equipamentoModel().findAll({ attributes });

      const hardwares = equipamentos.map(toHardware);

      const response: IpcResponse = {
        status: "success",
        message: "Dispositivos obtidos",
        data: hardwares,
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error("HardwareFindAllHandler error>", e.message);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível buscar dispositivos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

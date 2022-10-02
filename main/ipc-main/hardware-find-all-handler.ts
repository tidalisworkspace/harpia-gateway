import { HARDWARE_FIND_ALL } from "../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../shared/ipc/types";
import logger from "../../shared/logger";
import equipamentoModel, {
  Equipamento,
} from "../database/models/equipamento.model";
import store from "../store";
import { IpcHandler } from "./types";

export default class HardwareFindAllHandler implements IpcHandler {
  channel = HARDWARE_FIND_ALL;

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

  async handle(): Promise<IpcResponse> {
    try {
      const attributes = ["id", "nome", "ip", "porta", "fabricante"];

      const equipamentos = await equipamentoModel().findAll({ attributes });

      const hardwares = equipamentos.map(this.toHardware);

      return {
        status: "success",
        message: "Dispositivos obtidos",
        data: hardwares,
      };
    } catch (e) {
      logger.error(`ipcMain:${this.channel} ${e.name}:${e.message}`);

      return {
        status: "error",
        message: "Impossível buscar dispositivos",
      };
    }
  }
}

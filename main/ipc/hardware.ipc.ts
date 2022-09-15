import { IpcMainEvent } from "electron";
import {
  HardwareRebootIpcRequest,
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";
import logger from "../../shared/logger";
import equipamentoModel, {
  Equipamento,
} from "../database/models/equipamento.model";

import { deviceClients } from "../device-clients";
import { IpcHandler } from "./types";

function toHardware(equipamento: Equipamento) {
  return {
    key: equipamento.id,
    name: `${equipamento.id} ${equipamento.nome}`,
    ip: equipamento.ip,
    port: equipamento.porta,
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
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível buscar dispositivos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

export class HardwareRebootHandler implements IpcHandler {
  getName(): IpcMainChannel {
    return "hardware_reboot";
  }

  async handle(
    event: IpcMainEvent,
    request: HardwareRebootIpcRequest
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
          await deviceClient.reboot();
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
          message: `Alguns dispositivos não foram reiniciados: ${error}`,
        };

        event.sender.send(request.responseChannel, response);

        return;
      }

      const response: IpcResponse = {
        status: "success",
        message: "Dispositivos reiniciados",
      };

      event.sender.send(request.responseChannel, response);
    } catch (e) {
      logger.error(`ipcMain:${this.getName()} error ${e.name}:${e.message}`);

      const response: IpcResponse = {
        status: "error",
        message: "Impossível reiniciar dispositivos",
      };

      event.sender.send(request.responseChannel, response);
    }
  }
}

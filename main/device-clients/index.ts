import equipamentoModel from "../database/models/equipamento.model";
import logger from "../../shared/logger";
import { HikvisionClient } from "./hikvision.client";
import { IntelbrasClient } from "./intelbras.client";
import { DeviceClient } from "./types";

class DeviceClients {
  private clients: DeviceClient[] = [
    new HikvisionClient(),
    new IntelbrasClient(),
  ];

  async get(ip: string, port: number): Promise<DeviceClient> {
    const equipamento = await equipamentoModel().findOne({ where: { ip } });

    if (!equipamento) {
      logger.warn(`deviceClients:${ip} hardware not found`);
      return null;
    }

    const client = this.clients.find(
      (client) => client.getManufacturer().toString() === equipamento.fabricante
    );

    if (!client) {
      logger.warn(
        `deviceClients:${ip} client for manufacturer ${equipamento.fabricante} not found`
      );
      return null;
    }

    return client.init(ip, port);
  }
}

export const deviceClients = new DeviceClients();

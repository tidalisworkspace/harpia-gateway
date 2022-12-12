import logger from "../../shared/logger";
import equipamentoModel from "../database/models/equipamento.model";
import { AlphadigiClient } from "./alphadigi.client";
import { ControlidClient } from "./controlid.client";
import { HikvisionClient } from "./hikvision.client";
import { IntelbrasClient } from "./intelbras.client";
import { DeviceClient } from "./types";

class DeviceClients {
  private clients: DeviceClient<unknown>[] = [
    new HikvisionClient(),
    new IntelbrasClient(),
    new ControlidClient(),
    new AlphadigiClient(),
  ];

  async get(ip: string, port: number): Promise<DeviceClient<unknown>> {
    const equipamento = await equipamentoModel().findOne({
      attributes: ["fabricante"],
      where: { ip },
    });

    if (!equipamento) {
      logger.warn(`device-clients:${ip} hardware not found`);
      return null;
    }

    const client = this.clients.find(
      (client) => client.getManufacturer().toString() === equipamento.fabricante
    );

    if (!client) {
      logger.warn(
        `device-clients:${ip} not found manufacturer=${equipamento.fabricante}`
      );
      return null;
    }

    return client.init(ip, port);
  }
}

export const deviceClients = new DeviceClients();

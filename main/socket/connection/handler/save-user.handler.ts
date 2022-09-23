import path from "path";
import socket from "../..";
import logger from "../../../../shared/logger";
import equipamentoModel from "../../../database/models/equipamento.model";
import { deviceClients } from "../../../device-clients";
import { DeleteUsersParams } from "../../../device-clients/types";
import { DataHandler, RecordPeoplesRequest } from "./types";

export class SaveUserHandler implements DataHandler {
  getName(): string {
    return "record";
  }

  private async deleteUsersFromAllDevices(
    connectionId: string,
    ids: string[]
  ): Promise<void> {
    const equipamentos = await equipamentoModel().findAll();

    for (const equipamento of equipamentos) {
      const { ip, porta } = equipamento;

      const deviceClient = await deviceClients.get(ip, porta);

      if (!deviceClient) {
        continue;
      }

      try {
        await deviceClient.deleteUsers({ ids });
      } catch (e) {
        logger.error(
          `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
            e.message
          }`
        );
      }
    }
  }

  async handleAsync(
    connectionId: string,
    request: RecordPeoplesRequest
  ): Promise<void> {
    const { client, faceDirectory, peoples } = request.payload;

    const errors = [];

    const ids = peoples.map((people) => people.id);

    await this.deleteUsersFromAllDevices(connectionId, ids);

    for (let i = 0; i < peoples.length; i++) {
      const { id, name, expiration, devices, cards, photo } = peoples[i];

      for (let j = 0; j < devices.length; j++) {
        const { ip, port, rightPlans } = devices[j];

        const deviceClient = await deviceClients.get(ip, port);

        if (!deviceClient) {
          errors.push(`IP:${ip}:${port}`);
          continue;
        }

        try {
          await deviceClient.saveUser({
            id,
            name,
            rightPlans,
            expiration,
          });
        } catch (e) {
          logger.error(
            `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
              e.message
            }`
          );

          errors.push(`IP:${ip}:${port}`);

          continue;
        }

        for (let k = 0; k < cards.length; k++) {
          const number = cards[k];

          try {
            await deviceClient.saveCard({ id, number });
          } catch (e) {
            logger.error(
              `socket:handler:${this.getName()}:${connectionId} error ${
                e.name
              }:${e.message}`
            );
          }
        }

        const picture = path.join(faceDirectory, photo);

        try {
          await deviceClient.saveFace({
            id,
            picture,
          });
        } catch (e) {
          logger.error(
            `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
              e.message
            }`
          );
        }
      }
    }

    if (errors.length) {
      socket.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socket.sendSuccessMessage(connectionId, client, "CADASTRADO COM SUCESSO");
  }
}

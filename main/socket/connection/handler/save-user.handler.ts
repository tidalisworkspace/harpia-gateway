import path from "path";
import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, RecordPeoplesRequest } from "./types";

export class SaveUserHandler implements DataHandler {
  getName(): string {
    return "record";
  }

  async handle(
    connectionId: string,
    request: RecordPeoplesRequest
  ): Promise<void> {
    const { client, faceDirectory, peoples } = request.payload;

    const errors = [];

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

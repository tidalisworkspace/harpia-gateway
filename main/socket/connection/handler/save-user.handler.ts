import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, RecordPeoplesRequest } from "./types";
import path from "path";
import socket from "../..";

export class SaveUserHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: save user initilized");
  }

  getName(): string {
    return "record";
  }

  async handle(
    connectionId: string,
    request: RecordPeoplesRequest
  ): Promise<void> {
    try {
      const { client, faceDirectory, peoples } = request.payload;

      const errors = [];

      for (let i = 0; i < peoples.length; i++) {
        const people = peoples[i];
        const { cards, devices } = people;

        for (let j = 0; j < devices.length; j++) {
          const device = devices[j];

          const deviceClient = await deviceClients.get(device.ip, device.port);

          if (!deviceClient) {
            continue;
          }

          logger.info(
            `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
          );

          try {
            const response = await deviceClient.saveUser({
              id: people.id,
              name: people.name,
              rightPlans: device.rightPlans,
              expiration: people.expiration,
            });

            logger.debug("save user:", response.status, response.statusText);
          } catch (e) {
            logger.error(
              `[Socket] Connection [${connectionId}]: ${this.getName()} get an error with device ${
                device.ip
              }:${device.port} ${e.message}`
            );

            errors.push(`IP:${device.ip}:${device.port}`);

            continue;
          }

          for (let k = 0; k < cards.length; k++) {
            const card = cards[k];
            try {
              await deviceClient.saveCard({ id: people.id, number: card });
            } catch (e) {
              logger.error(
                `[Socket] Connection [${connectionId}]: ${this.getName()} get an error with device ${
                  device.ip
                }:${device.port} ${e.message}`
              );

              continue;
            }
          }

          const picture = path.join(faceDirectory, people.photo);

          try {
            const response = await deviceClient.saveFace({ id: people.id, picture });

            logger.debug("save face:", response.status, response.statusText);
          } catch (e) {
            logger.error(
              `[Socket] Connection [${connectionId}]: ${this.getName()} get an error with device ${
                device.ip
              }:${device.port} ${e.message}`
            );
          }
        }
      }

      if (errors.length) {
        socket.sendFailureMessage(connectionId, client, ...errors);
        return;
      }

      socket.sendSuccessMessage(connectionId, client, "CADASTRADO COM SUCESSO");
    } catch (e) {
      logger.error(
        `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );

      socket.sendFailureMessage(
        connectionId,
        request.payload.client,
        "ERRO INESPERADO"
      );
    }
  }
}

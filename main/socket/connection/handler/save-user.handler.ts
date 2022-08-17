import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, RecordPeoplesRequest } from "./types";
import path from "path";

export class SaveUserHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: save user initilized");
  }

  getName(): string {
    return "recordPeoples";
  }

  async handle(
    connectionId: string,
    request: RecordPeoplesRequest
  ): Promise<void> {
    try {
      const { client, faceDirectory, peoples } = request.payload;

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

          await deviceClient.saveUser(people);

          for (let k = 0; k < cards.length; k++) {
            const card = cards[k];
            await deviceClient.saveCard({ id: people.id, number: card });
          }

          const picture = path.join(faceDirectory, people.photo);

          await deviceClient.saveFace({ id: people.id, picture });
        }
      }
    } catch (e) {
      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );
    }
  }
}

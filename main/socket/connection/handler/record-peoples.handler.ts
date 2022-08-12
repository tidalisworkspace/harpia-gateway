
import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, RecordPeoplesRequest } from "./types";

export class RecordPeoplesHandler implements DataHandler {
  constructor() {
    logger.info("RecordPeoplesHandler initilized");
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

        for (let j = 0; j < people.devices.length; j++) {
          const device = people.devices[j];

          const deviceClient = await deviceClients.get(device.ip, device.port);

          if (!deviceClient) {
            continue;
          }

          logger.info(
            `Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
          );

          
        }
      }
    } catch (e) {
      logger.info(
        `Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );
    }
  }
}

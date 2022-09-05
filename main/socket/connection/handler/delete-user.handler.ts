import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DeleteUserRequest, DataHandler } from "./types";

export class DeleteUserHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: delete user initilized");
  }

  getName(): string {
    return "delete";
  }

  async handle(
    connectionId: string,
    request: DeleteUserRequest
  ): Promise<void> {
    try {
      const { client, peoples } = request.payload;

      for (let i = 0; i < peoples.length; i++) {
        const people = peoples[i];
        const { devices } = people;

        for (let j = 0; j < devices.length; j++) {
          const device = devices[j];

          const deviceClient = await deviceClients.get(device.ip, device.port);

          if (!deviceClient) {
            return;
          }

          logger.info(
            `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
          );

          await deviceClient.deleteUsers({ ids: [people.id] });
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

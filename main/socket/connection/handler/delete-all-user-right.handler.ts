import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, DeleteUserRightRequest } from "./types";

export class DeleteAllUserRightHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: delete all user right initilized");
  }

  getName(): string {
    return "deleteAllUserRight";
  }

  async handle(
    connectionId: string,
    request: DeleteUserRightRequest
  ): Promise<void> {
    try {
      const { client, devices } = request.payload;

      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];

        const deviceClient = await deviceClients.get(device.ip, device.port);

        if (!deviceClient) {
          return;
        }

        logger.info(
          `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
        );

        await deviceClient.deleteAllUserRight();
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


import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, TriggerRelayRequest } from "./types";

export class TriggerRelayHandler implements DataHandler {
  constructor() {
    logger.info("TriggerRelayHandler initilized");
  }

  getName(): string {
    return "triggerRelay";
  }

  async handle(
    connectionId: string,
    request: TriggerRelayRequest
  ): Promise<void> {
    try {
      const deviceClient = await deviceClients.get(
        request.payload.ip,
        request.payload.port
      );

      if (!deviceClient) {
        return;
      }

      logger.info(
        `Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
      );

      deviceClient.openDoor();
    } catch (e) {
      logger.info(
        `Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );
    }
  }
}

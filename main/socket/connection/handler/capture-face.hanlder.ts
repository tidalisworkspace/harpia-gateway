
import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { CaptureFaceRequest, DataHandler } from "./types";

export class CaptureFaceHandler implements DataHandler {
  constructor() {
    logger.info("CaptureFaceHandler initilized");
  }

  getName(): string {
    return "captureFace";
  }

  async handle(
    connectionId: string,
    request: CaptureFaceRequest
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

      const r = await deviceClient.captureFace();
      logger.info("device client capture response:", r.status, r.statusText);
    } catch (e) {
      logger.info(
        `Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );
    }
  }
}

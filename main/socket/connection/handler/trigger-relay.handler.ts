import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, TriggerRelayRequest } from "./types";
import socket from "../..";

export class TriggerRelayHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: trigger relay initilized");
  }

  getName(): string {
    return "triggerRelay";
  }

  async handle(
    connectionId: string,
    request: TriggerRelayRequest
  ): Promise<void> {
    try {
      const { client } = request.payload;

      const deviceClient = await deviceClients.get(
        request.payload.ip,
        request.payload.port
      );

      if (!deviceClient) {
        return;
      }

      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
      );

      await deviceClient.openDoor();

      socket.sendSuccessMessage(connectionId, client, "RELE ACIONADO");
    } catch (e) {
      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );

      socket.sendSuccessMessage(
        connectionId,
        request.payload.client,
        "ERRO AO ACIONAR RELE"
      );
    }
  }
}

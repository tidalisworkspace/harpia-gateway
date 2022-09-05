import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, RebootRequest, TriggerRelayRequest } from "./types";
import socket from "../..";

export class RebootHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: reboot initilized");
  }

  getName(): string {
    return "reboot";
  }

  async handle(connectionId: string, request: RebootRequest): Promise<void> {
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

      try {
        await deviceClient.reboot();

        socket.sendSuccessMessage(
          connectionId,
          client,
          "REINICIANDO EQUIPAMENTO"
        );
      } catch (e) {
        logger.info(
          `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
            e.message
          }`
        );

        socket.sendFailureMessage(
          connectionId,
          request.payload.client,
          "ERRO AO REINICIAR EQUIPAMENTO"
        );
      }
    } catch (e) {
      logger.info(
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

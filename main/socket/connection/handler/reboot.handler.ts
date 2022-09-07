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
      const { client, devices } = request.payload;

      const errors = [];

      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];

        const deviceClient = await deviceClients.get(device.ip, device.port);

        if (!deviceClient) {
          return;
        }

        logger.info(
          `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
        );

        try {
          await deviceClient.reboot();
        } catch (e) {
          logger.info(
            `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
              e.message
            }`
          );
        }
      }

      if (errors.length) {
        socket.sendFailureMessage(connectionId, client, ...errors);
        return;
      }

      socket.sendSuccessMessage(connectionId, client, "REINICIADO(S) COM SUCESSO");
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

import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DeleteUserRequest, DataHandler } from "./types";
import socket from "../..";

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

      const errors = [];

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

          try {
            await deviceClient.deleteUsers({ ids: [people.id] });
          } catch (e) {
            logger.error(
              `[Socket] Connection [${connectionId}]: ${this.getName()} get an error with device ${
                device.ip
              }:${device.port} ${e.message}`
            );

            errors.push(`IP:${device.ip}:${device.port}`);

            continue;
          }
        }
      }

      if (errors.length) {
        socket.sendFailureMessage(connectionId, client, ...errors);
        return;
      }

      socket.sendSuccessMessage(connectionId, client, "APAGADO(S) COM SUCESSO");
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

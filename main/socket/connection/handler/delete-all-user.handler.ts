import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DeleteUserRequest, DataHandler, DeleteAllUserRequest } from "./types";
import socket from "../..";

export class DeleteAllUserHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: delete all user initilized");
  }

  getName(): string {
    return "deleteAll";
  }

  async handle(
    connectionId: string,
    request: DeleteAllUserRequest
  ): Promise<void> {
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
          await deviceClient.deleteUsers({ ids: null });
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

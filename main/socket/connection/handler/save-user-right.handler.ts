import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, UserRightRequest } from "./types";
import socket from "../..";

export class SaveUserRightHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: save user right initilized");
  }

  getName(): string {
    return "setupRightWeekPlan";
  }

  async handle(connectionId: string, request: UserRightRequest): Promise<void> {
    try {
      const { client, rightPlans } = request.payload;

      const errors = [];

      for (let i = 0; i < rightPlans.length; i++) {
        const rightPlan = rightPlans[i];
        const { devices } = rightPlan;

        for (let j = 0; j < devices.length; j++) {
          const device = devices[j];

          const deviceClient = await deviceClients.get(device.ip, device.port);

          if (!deviceClient) {
            continue;
          }

          try {
            await deviceClient.saveUserRight(rightPlan);
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

      socket.sendSuccessMessage(connectionId, client, "CADASTRADO COM SUCESSO");
    } catch (e) {
      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );

      socket.sendSuccessMessage(
        connectionId,
        request.payload.client,
        "ERRO INESPERADO"
      );
    }
  }
}

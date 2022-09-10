import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, UserRightRequest } from "./types";

export class SaveUserRightHandler implements DataHandler {
  getName(): string {
    return "setupRightWeekPlan";
  }

  async handle(connectionId: string, request: UserRightRequest): Promise<void> {
    const { client, rightPlans } = request.payload;

    const errors = [];

    for (let i = 0; i < rightPlans.length; i++) {
      const rightPlan = rightPlans[i];
      const devices = rightPlan.devices;

      for (let j = 0; j < devices.length; j++) {
        const { ip, port } = devices[j];

        const deviceClient = await deviceClients.get(ip, port);

        if (!deviceClient) {
          errors.push(`IP:${ip}:${port}`);
          continue;
        }

        try {
          await deviceClient.saveUserRight(rightPlan);
        } catch (e) {
          logger.error(
            `socket:handler:${this.getName()}:${connectionId} error ${
              e.message
            }`,
            e
          );

          errors.push(`IP:${ip}:${port}`);

          continue;
        }
      }
    }

    if (errors.length) {
      socket.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socket.sendSuccessMessage(connectionId, client, "CADASTRADO COM SUCESSO");
  }
}

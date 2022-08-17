import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { DataHandler, UserRightRequest } from "./types";

export class SaveUserRightHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: save user right initilized");
  }

  getName(): string {
    return "setupRightWeekPlan";
  }

  async handle(connectionId: string, request: UserRightRequest): Promise<void> {
    try {
      const { rightPlans } = request.payload;

      for (let i = 0; i < rightPlans.length; i++) {
        const rightPlan = rightPlans[i];
        const { devices } = rightPlan;

        for (let j = 0; j < devices.length; j++) {
          const device = devices[j];

          const deviceClient = await deviceClients.get(device.ip, device.port);

          if (!deviceClient) {
            continue;
          }

          await deviceClient.saveUserRight(rightPlan);
        }
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

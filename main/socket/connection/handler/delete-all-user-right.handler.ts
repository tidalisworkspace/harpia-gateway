import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, DeleteUserRightRequest } from "./types";

export class DeleteAllUserRightHandler implements DataHandler {
  getName(): string {
    return "clearRightWeekPlan";
  }

  async handle(
    connectionId: string,
    request: DeleteUserRightRequest
  ): Promise<void> {
    const { client, devices } = request.payload;

    const errors = [];

    for (let i = 0; i < devices.length; i++) {
      const { ip, port } = devices[i];

      const deviceClient = await deviceClients.get(ip, port);

      if (!deviceClient) {
        errors.push(`IP:${ip}:${port}`);
        continue;
      }

      try {
        await deviceClient.deleteAllUserRight();
      } catch (e) {
        logger.error(
          `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
            e.message
          }`
        );

        errors.push(`IP:${ip}:${port}`);

        continue;
      }
    }

    if (errors.length) {
      socket.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socket.sendSuccessMessage(connectionId, client, "APAGADO COM SUCESSO");
  }
}

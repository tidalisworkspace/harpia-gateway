import socketServer from "..";
import logger from "../../../shared/logger";
import { deviceClients } from "../../device-clients";
import {
  SocketConnectionHandler,
  DeleteUserRightRequest,
} from "../types/handler.types";

export class DeleteAllUserRightHandler implements SocketConnectionHandler {
  name = "clearRightWeekPlan";

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
          `socket:handler:${this.name}:${connectionId} error ${e.name}:${e.message}`
        );

        errors.push(`IP:${ip}:${port}`);

        continue;
      }
    }

    if (errors.length) {
      socketServer.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socketServer.sendSuccessMessage(
      connectionId,
      client,
      "APAGADO COM SUCESSO"
    );
  }
}

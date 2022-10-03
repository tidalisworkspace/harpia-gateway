import socketServer from "..";
import logger from "../../../shared/logger";
import { deviceClients } from "../../device-clients";
import {
  DeleteUserRequest,
  SocketConnectionHandler,
} from "../types/handler.types";

export class DeleteUserHandler implements SocketConnectionHandler {
  name = "delete";

  async handle(
    connectionId: string,
    request: DeleteUserRequest
  ): Promise<void> {
    const { client, peoples } = request.payload;

    const errors = [];

    for (let i = 0; i < peoples.length; i++) {
      const people = peoples[i];
      const { id, devices } = people;

      for (let j = 0; j < devices.length; j++) {
        const { ip, port } = devices[j];

        const deviceClient = await deviceClients.get(ip, port);

        if (!deviceClient) {
          errors.push(`IP:${ip}:${port}`);
          continue;
        }

        try {
          await deviceClient.deleteUsers({ ids: [id] });
        } catch (e) {
          logger.error(
            `socket:handler:${this.name}:${connectionId} error ${e.name}:${e.message}`
          );

          errors.push(`IP:${ip}:${port}`);

          continue;
        }
      }
    }

    if (errors.length) {
      socketServer.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socketServer.sendSuccessMessage(
      connectionId,
      client,
      "APAGADO(S) COM SUCESSO"
    );
  }
}

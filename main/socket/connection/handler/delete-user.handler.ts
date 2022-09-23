import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, DeleteUserRequest } from "./types";

export class DeleteUserHandler implements DataHandler {
  getName(): string {
    return "delete";
  }

  async handleAsync(
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
            `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
              e.message
            }`
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

    socket.sendSuccessMessage(connectionId, client, "APAGADO(S) COM SUCESSO");
  }
}

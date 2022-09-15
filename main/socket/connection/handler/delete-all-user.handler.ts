import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, DeleteAllUserRequest } from "./types";

export class DeleteAllUserHandler implements DataHandler {
  getName(): string {
    return "deleteAll";
  }

  async handle(
    connectionId: string,
    request: DeleteAllUserRequest
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
        await deviceClient.deleteUsers({ ids: null });
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

    socket.sendSuccessMessage(connectionId, client, "APAGADO(S) COM SUCESSO");
  }
}

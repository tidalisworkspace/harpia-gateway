import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, RebootRequest } from "./types";

export class RebootHandler implements DataHandler {
  getName(): string {
    return "reboot";
  }

  async handleAsync(
    connectionId: string,
    request: RebootRequest
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
        await deviceClient.reboot();
      } catch (e) {
        logger.info(
          `socket:handler:${this.getName()}:${connectionId} error ${e.message}`,
          e
        );

        continue;
      }
    }

    if (errors.length) {
      socket.sendFailureMessage(connectionId, client, ...errors);
      return;
    }

    socket.sendSuccessMessage(
      connectionId,
      client,
      "REINICIADO(S) COM SUCESSO"
    );
  }
}

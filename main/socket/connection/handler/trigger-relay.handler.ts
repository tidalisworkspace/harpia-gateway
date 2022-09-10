import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { DataHandler, TriggerRelayRequest } from "./types";

export class TriggerRelayHandler implements DataHandler {
  getName(): string {
    return "triggerRelay";
  }

  async handle(
    connectionId: string,
    request: TriggerRelayRequest
  ): Promise<void> {
    const { client, ip, port } = request.payload;

    const deviceClient = await deviceClients.get(ip, port);

    if (!deviceClient) {
      socket.sendFailureMessage(connectionId, client, "CLIENTE NAO ENCONTRADO");
      return;
    }

    try {
      await deviceClient.openDoor();

      socket.sendSuccessMessage(connectionId, client, "RELE ACIONADO");
    } catch (e) {
      logger.info(
        `socket:handler:${this.getName()}:${connectionId} error ${e.message}`,
        e
      );

      socket.sendFailureMessage(connectionId, client, "ERRO AO ACIONAR RELE");
    }
  }
}

import socketServer from "..";
import logger from "../../../shared/logger";
import { deviceClients } from "../../device-clients";
import {
  SocketConnectionHandler,
  TriggerRelayRequest,
} from "../types/handler.types";

export class TriggerRelayHandler implements SocketConnectionHandler {
  name = "triggerRelay";

  async handle(
    connectionId: string,
    request: TriggerRelayRequest
  ): Promise<void> {
    const { client, ip, port } = request.payload;

    const deviceClient = await deviceClients.get(ip, port);

    if (!deviceClient) {
      socketServer.sendFailureMessage(
        connectionId,
        client,
        "CLIENTE NAO ENCONTRADO"
      );
      return;
    }

    try {
      await deviceClient.openDoor();

      socketServer.sendSuccessMessage(connectionId, client, "RELE ACIONADO");
    } catch (e) {
      logger.info(
        `socket:handler:${this.name}:${connectionId} error ${e.message}`,
        e
      );

      socketServer.sendFailureMessage(
        connectionId,
        client,
        "ERRO AO ACIONAR RELE"
      );
    }
  }
}

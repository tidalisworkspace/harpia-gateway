import socketServer from "..";
import logger from "../../../shared/logger";
import { deviceClients } from "../../device-clients";
import { SocketConnectionHandler, RebootRequest } from "../types/handler.types";

export class RebootHandler implements SocketConnectionHandler {
  name = "reboot";

  async handle(connectionId: string, request: RebootRequest): Promise<void> {
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
          `socket:handler:${this.name}:${connectionId} error ${e.message}`,
          e
        );

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
      "REINICIADO(S) COM SUCESSO"
    );
  }
}

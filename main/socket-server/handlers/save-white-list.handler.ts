import socketServer from "..";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import store from "../../store";
import {
  SaveWhiteListRequest, SocketConnectionHandler
} from "../types/handler.types";

export class SaveWhiteListHandler implements SocketConnectionHandler {
  name = "saveWhiteList";

  async handle(
    connectionId: string,
    request: SaveWhiteListRequest
  ): Promise<void> {
    const { client, devices } = request.payload;

    const errors = [];

    for (let i = 0; i < devices.length; i++) {
      const { ip, port, plates } = devices[i];

      if (!plates || !plates.length) {
        continue;
      }

      const equipamento = await equipamentoModel().findOne({
        attributes: ["id"],
        where: { ip },
      });

      if (!equipamento) {
        errors.push(`IP:${ip}:${port}`);
        continue;
      }

      try {
        store.setWhiteList(ip, plates);
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
      "PLACAS SALVA(S) COM SUCESSO"
    );
  }
}

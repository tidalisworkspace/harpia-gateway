import socketServer from "..";
import logger from "../../../shared/logger";
import equipamentoModel from "../../database/models/equipamento.model";
import store from "../../store";
import { CameraCommand, CameraQueueMessage } from "../camera-handlers/types";
import {
  SaveWhiteListRequest,
  SocketConnectionHandler,
} from "../types/handler.types";

export class DeleteAllWhiteListHandler implements SocketConnectionHandler {
  name = "deleteAllWhiteList";

  async handle(
    connectionId: string,
    request: SaveWhiteListRequest
  ): Promise<void> {
    const { client, devices } = request.payload;

    const errors = [];

    for (let i = 0; i < devices.length; i++) {
      const { ip, port } = devices[i];

      const equipamento = await equipamentoModel().findOne({
        attributes: ["id"],
        where: { ip },
      });

      if (!equipamento) {
        errors.push(`IP:${ip}:${port}`);
        continue;
      }

      try {
        const message: CameraQueueMessage = {
          command: CameraCommand.DELETE_ALL_WHITE_LIST,
        };

        store.addCameraQueueHttp(ip, message);
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

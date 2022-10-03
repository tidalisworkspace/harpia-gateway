import fs from "fs";
import path from "path";
import socketServer from "..";
import logger from "../../../shared/logger";
import { deviceClients } from "../../device-clients";
import {
  CaptureFaceRequest,
  SocketConnectionHandler,
} from "../types/handler.types";

export class CaptureFaceHandler implements SocketConnectionHandler {
  name = "captureFace";

  async handle(
    connectionId: string,
    request: CaptureFaceRequest
  ): Promise<void> {
    const { client, faceDirectory, peopleId, ip, port } = request.payload;

    const deviceClient = await deviceClients.get(ip, port);

    if (!deviceClient) {
      socketServer.sendFailureMessage(
        connectionId,
        client,
        "CLIENTE NAO ENCONTRADO"
      );
      return;
    }

    let faceBase64;
    try {
      faceBase64 = await deviceClient.captureFace();
    } catch (e) {
      logger.error(
        `socket:handler:${this.name}:${connectionId} error ${e.name}:${e.message}`
      );

      socketServer.sendFailureMessage(connectionId, client, "ERRO NA CAPTURA");

      return;
    }

    const facePath = path.join(faceDirectory, `${peopleId}.jpg`);

    try {
      fs.writeFileSync(facePath, faceBase64, { encoding: "base64" });
    } catch (e) {
      logger.error(
        `socket:handler:${this.name}:${connectionId} error ${e.name}:${e.message}`
      );

      socketServer.sendFailureMessage(
        connectionId,
        client,
        `ERRO NA ESCRITA DA FOTO EM ${facePath}`
      );

      return;
    }

    socketServer.sendSuccessMessage(
      connectionId,
      client,
      "CAPTURADO COM SUCESSO"
    );
  }
}

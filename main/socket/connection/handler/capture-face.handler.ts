import fs from "fs";
import path from "path";
import socket from "../..";
import logger from "../../../../shared/logger";
import { deviceClients } from "../../../device-clients";
import { CaptureFaceRequest, DataHandler } from "./types";

export class CaptureFaceHandler implements DataHandler {
  getName(): string {
    return "captureFace";
  }

  async handleAsync(
    connectionId: string,
    request: CaptureFaceRequest
  ): Promise<void> {
    const { client, faceDirectory, peopleId, ip, port } = request.payload;

    const deviceClient = await deviceClients.get(ip, port);

    if (!deviceClient) {
      socket.sendFailureMessage(connectionId, client, "CLIENTE NAO ENCONTRADO");
      return;
    }

    let faceBase64;
    try {
      faceBase64 = await deviceClient.captureFace();
    } catch (e) {
      logger.error(
        `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
          e.message
        }`
      );

      socket.sendFailureMessage(connectionId, client, "ERRO NA CAPTURA");

      return;
    }

    const facePath = path.join(faceDirectory, `${peopleId}.jpg`);

    try {
      fs.writeFileSync(facePath, faceBase64, { encoding: "base64" });
    } catch (e) {
      logger.error(
        `socket:handler:${this.getName()}:${connectionId} error ${e.name}:${
          e.message
        }`
      );

      socket.sendFailureMessage(
        connectionId,
        client,
        `ERRO NA ESCRITA DA FOTO EM ${facePath}`
      );

      return;
    }

    socket.sendSuccessMessage(connectionId, client, "CAPTURADO COM SUCESSO");
  }
}

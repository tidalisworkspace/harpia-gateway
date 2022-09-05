import { deviceClients } from "../../../device-clients";
import logger from "../../../../shared/logger";
import { CaptureFaceRequest, DataHandler } from "./types";
import fs from "fs";
import path from "path";
import socket from "../..";

export class CaptureFaceHandler implements DataHandler {
  constructor() {
    logger.info("[Socket] Handler: capture face initilized");
  }

  getName(): string {
    return "captureFace";
  }

  async handle(
    connectionId: string,
    request: CaptureFaceRequest
  ): Promise<void> {
    try {
      const { client, faceDirectory, peopleId } = request.payload;

      const deviceClient = await deviceClients.get(
        request.payload.ip,
        request.payload.port
      );

      if (!deviceClient) {
        return;
      }

      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} with ${deviceClient.getManufacturer()} client`
      );

      try {
        const faceBase64 = await deviceClient.captureFace();
        const facePath = path.join(faceDirectory, `${peopleId}.jpg`);

        logger.debug(
          `[Socket] Connection [${connectionId}]: ${this.getName()} writing file on path ${facePath}`
        );

        fs.writeFileSync(facePath, faceBase64, { encoding: "base64" });

        socket.sendSuccessMessage(
          connectionId,
          client,
          "CAPTURADO COM SUCESSO"
        );
      } catch (e) {
        logger.info(
          `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
            e.message
          }`
        );

        socket.sendFailureMessage(connectionId, client, "ERRO NA CAPTURA");
      }
    } catch (e) {
      logger.info(
        `[Socket] Connection [${connectionId}]: ${this.getName()} get an error: ${
          e.message
        }`
      );

      socket.sendFailureMessage(
        connectionId,
        request.payload.client,
        "ERRO INESPERADO"
      );
    }
  }
}

import logger from "../../../shared/logger";

export default class CameraHandlerManager {
  resolve(connectionId: string, data: Buffer): void {
    logger.debug(
      `socket:camera-handler:${connectionId} resolving ${data.toString("hex")}`
    );
  }
}

import logger from "../../../shared/logger";
import { HeaderWritter } from "./header-writter";
import {
    MessageHeader,
    MessageType,
    SocketCameraConnectionHandler
} from "./types";

export class ResponseHandler implements SocketCameraConnectionHandler {
  name = "response";
  messageType = MessageType.RESPONSE;
  headerWritter: HeaderWritter;

  constructor(headerWritter: HeaderWritter) {
    this.headerWritter = headerWritter;
  }

  async handle(connectionId: string, header: MessageHeader): Promise<void> {
    logger.warn(
      `socket:camera-handler:${this.name}:${connectionId} handler not implemented`
    );
  }
}

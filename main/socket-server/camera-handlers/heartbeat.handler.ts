import logger from "../../../shared/logger";
import { HeaderWritter } from "./header-writter";
import {
  MessageHeader,
  MessageType,
  SocketCameraConnectionHandler,
} from "./types";

export class HeartbeatHandler implements SocketCameraConnectionHandler {
  name = "heartbeat";
  messageType = MessageType.HEARTBEAT;
  headerWritter: HeaderWritter;

  constructor(headerWritter: HeaderWritter) {
    this.headerWritter = headerWritter;
  }

  async handle(connectionId: string, header: MessageHeader): Promise<void> {
    logger.warn(
      `socket:camera-handler:${this.name}:${connectionId} handle not implemented`
    );
  }
}

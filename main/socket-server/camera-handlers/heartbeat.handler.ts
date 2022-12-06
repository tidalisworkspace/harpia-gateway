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
    throw new Error("handler not implemented");
  }
}

import logger from "../../../shared/logger";
import getEnumNameByValue from "../../helpers/get-enum-name-by-value";
import { BodyReader } from "./body-reader";
import { HeaderReader } from "./header-reader";
import {
  MessageHeader,
  MessageType,
  SocketCameraConnectionHandler,
} from "./types";

export default class CameraHandlerManager {
  private headerReader: HeaderReader;
  private bodyReader: BodyReader;
  private handlers: SocketCameraConnectionHandler[];

  constructor(
    headerReader: HeaderReader,
    bodyReader: BodyReader,
    handlers: SocketCameraConnectionHandler[]
  ) {
    this.headerReader = headerReader;
    this.bodyReader = bodyReader;
    this.handlers = handlers;
  }

  private getHandler(header: MessageHeader, body: any): any {
    const handler = this.handlers.find(
      (handler) =>
        handler.messageType === header.msgtype && handler.name === body.message
    );

    if (!handler) {
      const messageTypeName = getEnumNameByValue(header.msgtype, MessageType)
      logger.warn(`socket:camera-handler no handler found for message type ${messageTypeName}=${header.msgtype} and name ${body.message}`)
    }

    return handler;
  }

  resolve(connectionId: string, data: Buffer): void {
    logger.debug(
      `socket:camera-handler:${connectionId} resolving ${data.toString("hex")}`
    );

    const header = this.headerReader.read(data);

    if (!header) {
      return;
    }

    if (header.msgtype === MessageType.HEARTBEAT) {
      return;
    }

    const body = this.bodyReader.read(data);

    if (!body) {
      return;
    }

    const handler = this.getHandler(header, body);

    if (!handler) {
      return;
    }

    try {
      handler.handle(connectionId, header, body);
    } catch (e) {
      logger.warn(
        `socket:camera-handler:${connectionId} unexpected error on handler ${handler.name} ${e.message}`,
        e
      );
    }
  }
}

import logger from "../../../shared/logger";
import { isDev } from "../../helpers/environment";
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

  private byMessageTypeAndName(messageType: number, name: string) {
    return (handler: SocketCameraConnectionHandler) =>
      handler.messageType === messageType && handler.name === name;
  }

  private heartbeatHandler() {
    return (handler: SocketCameraConnectionHandler) =>
      handler.messageType === MessageType.HEARTBEAT;
  }

  private responseHandler() {
    return (handler: SocketCameraConnectionHandler) =>
      handler.messageType === MessageType.RESPONSE;
  }

  private getHandler(header: MessageHeader, body: any): any {
    if (header.msgtype === MessageType.HEARTBEAT) {
      return this.handlers.find(this.heartbeatHandler());
    }

    if (header.msgtype === MessageType.RESPONSE) {
      return this.handlers.find(this.responseHandler());
    }

    if (!body) {
      logger.warn(`socket:camera-handler body is required to find handler`);
      return null;
    }

    const handler = this.handlers.find(
      this.byMessageTypeAndName(header.msgtype, body?.message)
    );

    if (!handler) {
      const messageTypeName = getEnumNameByValue(header.msgtype, MessageType);
      logger.warn(
        `socket:camera-handler no handler found for message type ${messageTypeName}=${header.msgtype} and name "${body.message}"`
      );
    }

    return handler;
  }

  async resolve(connectionId: string, data: Buffer): Promise<void> {
    if (isDev) {
      logger.debug(
        `socket:camera-handler:${connectionId} resolving ${data.toString(
          "hex"
        )}`
      );
    }

    const header = this.headerReader.read(data);

    if (!header) {
      return;
    }

    const body = this.bodyReader.read(data);

    const handler = this.getHandler(header, body);

    if (!handler) {
      return;
    }

    try {
      await handler.handle(connectionId, header, body);
    } catch (e) {
      logger.warn(
        `socket:camera-handler:${connectionId} unexpected error on handler ${handler.name} ${e.name}:${e.message}`,
        e
      );
    }
  }
}

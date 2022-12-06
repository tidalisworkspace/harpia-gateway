import socketServer from "..";
import logger from "../../../shared/logger";
import { Request, SocketConnectionHandler } from "../types/handler.types";

export default class HandlerManager {
  private handlers: SocketConnectionHandler[];

  constructor(handlers: SocketConnectionHandler[]) {
    this.handlers = handlers;
  }

  private toRequest(json: any): Request {
    const functionName = Object.keys(json)[0];
    const payload = json[functionName];

    if (!functionName) {
      logger.warn(
        "socket:handler function name required. expected format: { [functionName]: { <payload> } }"
      );

      return null;
    }

    if (!payload) {
      logger.warn(
        "socket:handler payload is required. expected format: { [functionName]: { payload } }"
      );

      return null;
    }

    return {
      functionName,
      payload,
    };
  }

  private getHandler(functionName: string): SocketConnectionHandler {
    const handler = this.handlers.find(
      (handler) => handler.name === functionName
    );

    if (!handler) {
      logger.warn(
        `socket:handler no handler found for function ${functionName}`
      );
    }

    return handler;
  }

  async resolve(connectionId: string, json: any): Promise<void> {
    logger.debug(
      `socket:handler:${connectionId} resolving ${JSON.stringify(json)}`
    );

    const request = this.toRequest(json);

    if (!request) {
      return;
    }

    socketServer.sendAckMessage(connectionId, request.payload.client);

    const handler = this.getHandler(request.functionName);

    if (!handler) {
      return;
    }

    try {
      await handler.handle(connectionId, request);
    } catch (e) {
      logger.warn(
        `socket:handler:${connectionId} unexpected error on handler ${handler.name} ${e.message}`,
        e
      );

      socketServer.sendFailureMessage(
        connectionId,
        request.payload.client,
        "ERRO INESPERADO"
      );
    }
  }
}

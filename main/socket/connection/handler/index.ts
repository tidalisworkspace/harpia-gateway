import socket from "../..";
import logger from "../../../../shared/logger";
import { CaptureFaceHandler } from "./capture-face.handler";
import { DeleteAllUserRightHandler } from "./delete-all-user-right.handler";
import { DeleteAllUserHandler } from "./delete-all-user.handler";
import { DeleteUserHandler } from "./delete-user.handler";
import { RebootHandler } from "./reboot.handler";
import { SaveUserRightHandler } from "./save-user-right.handler";
import { SaveUserHandler } from "./save-user.handler";
import { TriggerRelayHandler } from "./trigger-relay.handler";
import { DataHandler, Request } from "./types";

export class Handler {
  private handlers: DataHandler[];

  constructor() {
    this.handlers = [
      new CaptureFaceHandler(),
      new DeleteAllUserRightHandler(),
      new DeleteAllUserHandler(),
      new DeleteUserHandler(),
      new RebootHandler(),
      new SaveUserRightHandler(),
      new SaveUserHandler(),
      new TriggerRelayHandler(),
    ];
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

  private getHandler(functionName: string): DataHandler {
    const handler = this.handlers.find(
      (handler) => handler.getName() === functionName
    );

    if (!handler) {
      logger.warn(
        `socket:handler no handler found for function ${functionName}`
      );
    }

    return handler;
  }

  resolve(connectionId: string, json: any): void {
    logger.debug(
      `socket:handler:${connectionId} resolving ${JSON.stringify(json)}`
    );

    const request = this.toRequest(json);

    if (!request) {
      return;
    }

    socket.sendAckMessage(connectionId, request.payload.client);

    const handler = this.getHandler(request.functionName);

    if (!handler) {
      return;
    }

    try {
      handler.handle(connectionId, request);
    } catch (e) {
      logger.warn(
        `socket:handler:${connectionId} unexpected error on handler ${handler.getName()} ${
          e.message
        }`,
        e
      );

      socket.sendFailureMessage(
        connectionId,
        request.payload.client,
        "ERRO INESPERADO"
      );
    }
  }
}

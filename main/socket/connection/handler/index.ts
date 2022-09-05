import logger from "../../../../shared/logger";
import { CaptureFaceHandler } from "./capture-face.handler";
import { DeleteAllUserRightHandler } from "./delete-all-user-right.handler";
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
      throw new Error(
        "function name required. expected format: { [functionName]: { payload } }"
      );
    }

    if (!payload) {
      throw new Error(
        "payload is required. expected format: { [functionName]: { payload } }"
      );
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
      throw new Error(`no handler found for function "${functionName}"`);
    }

    return handler;
  }

  resolve(connectionId: string, json: any): void {
    try {
      const request = this.toRequest(json);

      const handler = this.getHandler(request.functionName);

      handler.handle(connectionId, request);
    } catch (e) {
      logger.warn(
        `Connection [${connectionId}]: error (when handle request) ${e.message}`
      );
    }
  }
}

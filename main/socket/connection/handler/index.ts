
import logger from "../../../../shared/logger";
import { CaptureFaceHandler } from "./capture-face.hanlder";
import { TriggerRelayHandler } from "./trigger-relay.handler";
import { DataHandler, Request } from "./types";

logger.info("initializing data handlers...");
const handlers = [new TriggerRelayHandler(), new CaptureFaceHandler()];

export class Handler {
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
    const handler = handlers.find(
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

import { HTTP_STATE } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import httpServer from "../../../http-server";
import { IpcHandler } from "../../types";

export default class HttpStateHandler implements IpcHandler {
  channel = HTTP_STATE;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: httpServer.getState(),
    };
  }
}

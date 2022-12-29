import { HTTP_STATE } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import httpServer from "../../../http-server";
import { IpcMainHandler } from "../../types";

export default class HttpStateHandler implements IpcMainHandler {
  channel = HTTP_STATE;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: httpServer.getState(),
    };
  }
}

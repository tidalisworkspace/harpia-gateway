import { HTTP_STATE } from "../../shared/constants/ipc-main-channels";
import { IpcResponse } from "../../shared/ipc/types";
import http from "../http";
import { IpcHandler } from "./types";

export default class HttpStateHandler implements IpcHandler {
  channel = HTTP_STATE;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: http.getState(),
    };
  }
}

import { HTTP_PORT } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import http from "../../../http";
import { IpcHandler } from "../../types";

export default class HttpPortHandler implements IpcHandler {
  channel = HTTP_PORT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: http.getPort(),
    };
  }
}

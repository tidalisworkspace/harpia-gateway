import { HTTP_IP } from "../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../shared/ipc/types";
import http from "../http";
import { IpcHandler } from "./types";

export default class HttpIpHandler implements IpcHandler {
  channel = HTTP_IP;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: http.getIp(),
    };
  }
}

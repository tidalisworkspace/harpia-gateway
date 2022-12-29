import { HTTP_PORT } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import httpServer from "../../../http-server";
import { IpcMainHandler } from "../../types";

export default class HttpPortHandler implements IpcMainHandler {
  channel = HTTP_PORT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: httpServer.getPort(),
    };
  }
}

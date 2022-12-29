import { SOCKET_STATE } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import socketServer from "../../../socket-server";
import { IpcMainHandler } from "../../types";

export default class SocketStateHandler implements IpcMainHandler {
  channel = SOCKET_STATE;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: socketServer.getState(),
    };
  }
}

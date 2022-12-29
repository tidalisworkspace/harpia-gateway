import { SOCKET_PORT } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import socketServer from "../../../socket-server";
import { IpcMainHandler } from "../../types";

export default class SocketPortHandler implements IpcMainHandler {
  channel = SOCKET_PORT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: socketServer.getPort(),
    };
  }
}

import { SOCKET_PORT } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import socketServer from "../../../socket-server";
import { IpcHandler } from "../../types";

export default class SocketPortHandler implements IpcHandler {
  channel = SOCKET_PORT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: socketServer.getPort(),
    };
  }
}

import { SOCKET_PORT } from "../../shared/constants/ipc-main-channels";
import { IpcResponse } from "../../shared/ipc/types";
import socket from "../socket";
import { IpcHandler } from "./types";

export default class SocketPortHandler implements IpcHandler {
  channel = SOCKET_PORT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: socket.getPort(),
    };
  }
}

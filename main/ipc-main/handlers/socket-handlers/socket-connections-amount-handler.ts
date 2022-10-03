import { SOCKET_CONNECTIONS_AMOUNT } from "../../../../shared/constants/ipc-main-channels.constants";
import { IpcResponse } from "../../../../shared/ipc/types";
import storage from "../../../socket-server/connection-manager/storage";
import { IpcHandler } from "../../types";

export default class SocketConnectionsAmountHandler implements IpcHandler {
  channel = SOCKET_CONNECTIONS_AMOUNT;

  async handle(): Promise<IpcResponse> {
    return {
      status: "success",
      data: storage.count(),
    };
  }
}

import { IpcMainEvent, IpcMainInvokeEvent } from "electron";
import {
  IpcMainChannel,
  IpcRequest,
  IpcResponse,
} from "../../shared/ipc/types";

export interface IpcHandler {
  readonly channel?: IpcMainChannel;
  getChannel(): IpcMainChannel;
  handleAsync(event: IpcMainEvent, request: IpcRequest): Promise<void>;
  handleSync(
    event: IpcMainInvokeEvent,
    request: IpcRequest
  ): Promise<IpcResponse>;
}

import { IpcMainInvokeEvent } from "electron";
import { IpcRequest, IpcResponse } from "../../shared/ipc/types";

export interface IpcMainHandler {
  readonly channel: string;
  handle(event: IpcMainInvokeEvent, request?: IpcRequest): Promise<IpcResponse>;
}

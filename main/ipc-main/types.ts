import { IpcMainEvent } from "electron";
import { IpcMainChannel, IpcRequest } from "../../shared/ipc/types";

export interface IpcHandler {
  getName(): IpcMainChannel;
  handle(event: IpcMainEvent, request: IpcRequest): Promise<void>;
}

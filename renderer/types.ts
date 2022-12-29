import { IpcMessage } from "../shared/ipc/types";

export type IpcRendererHandle = (message: IpcMessage) => void;

export interface IpcRendererHandler {
  channel: string;
  handle: IpcRendererHandle;
}

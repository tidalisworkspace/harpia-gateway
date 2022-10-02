import { IpcResponse } from "../shared/ipc/types";

export type IpcRendererListener = (response: IpcResponse) => void;

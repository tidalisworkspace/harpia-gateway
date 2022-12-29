export type IpcResponseStatus = "success" | "error";

export interface IpcResponse {
  status: IpcResponseStatus;
  message?: string;
  data?: any;
}

export interface IpcRequest {
  channel: string;
  params?: any;
}

export interface IpcMessage {
  channel: string;
  data: any;
}

export interface HardwareAddress {
  ip: string;
  port: number;
}

export interface HardwareCommandIpcRequest extends IpcRequest {
  params?: HardwareAddress[];
}

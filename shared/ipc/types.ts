export type IpcResponseStatus = "success" | "error";

export interface IpcResponse {
  status: IpcResponseStatus;
  message?: string;
  data?: any;
}

export interface IpcRequest {
  params?: any;
}

export interface HardwareAddress {
  ip: string;
  port: number;
}

export interface HardwareCommandIpcRequest extends IpcRequest {
  params?: HardwareAddress[];
}
